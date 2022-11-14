const games = require('../database/models/game.model');
const cardPacks = require('../database/data/cah-cards-full-official-only.json');

module.exports = (io, socket) => {
  const startGame = (lobbyCode) => {
    const game = games[lobbyCode];
    const players = game.players;

    if (players.length < 3) {
      io.to(lobbyCode).emit(
        'game:error',
        'Cannot start game with less than 3 players'
      );
      return;
    }

    game.czar_index = 0;
    game.current_round = 1;
    game.played_this_round = [];
    game.score_board = {};
    for (let player of players) {
      game.score_board[player.id] = 0;
    }

    // todo: add logic to select from all packs / allow user to select packs
    // todo: extract the card deck creation and shuffling logic to its own function
    let blackCards = shuffle(cardPacks[13].black);
    let whiteCards = shuffle(cardPacks[13].white);

    for (let i = 0; i < whiteCards.length; i++) {
      whiteCards[i].id = i + 1;
    }

    for (let i = 0; i < blackCards.length; i++) {
      blackCards[i].id = i + 1;
    }

    game.black_cards = blackCards;
    game.white_cards = whiteCards;

    // predecide the turn order in which players move for actions
    // like drawing cards
    let turnOrder = 0;
    for (let player of players) {
      io.to(player.socket_id).emit('game:started', turnOrder++);
    }
  };

  const drawCards = (lobbyCode, cardCount) => {
    const game = games[lobbyCode];

    let cardsToSend = [];
    // todo: extract card draw logic to its own function
    if (cardCount > 0) {
      cardsToSend = game.white_cards.slice(0, cardCount);
      game.white_cards = game.white_cards.slice(cardCount);
    }

    io.to(socket.id).emit('game:cards', cardsToSend);
  };

  const startRound = (lobbyCode) => {
    const game = games[lobbyCode];

    // reset current czar status and select a new czar
    game.players.map((p) => {
      p.is_czar = false;
      return p;
    });
    game.inactive_players = [];
    game.players[game.czar_index].is_czar = true;

    io.to(socket.id).emit(
      'game:round-started',
      game.current_round,
      game.players[game.czar_index],
      game.black_cards.at(-1)
    );
  };

  const playCards = (lobbyCode, playedCards) => {
    const game = games[lobbyCode];

    // save cards played this round
    game.played_this_round = game.played_this_round.concat(playedCards);

    // inform others of what current player played
    io.to(lobbyCode).emit('game:cards-played', playedCards);

    // if all players have played then ask czar to select winner
    if (game.played_this_round.length === game.players.length - 1) {
      io.to(lobbyCode).emit('game:select-winner');
    }
  };

  const playerSkippedRound = (lobbyCode, player) => {
    const game = games[lobbyCode];

    game.inactive_players.push(player);

    const overallPlayedCount =
      game.played_this_round.length + game.inactive_players.length;
    // if all players have played then ask czar to select winner
    if (overallPlayedCount === game.players.length - 1) {
      io.to(lobbyCode).emit('game:select-winner');
    }
  };

  const selectWinner = (lobbyCode, winner) => {
    const game = games[lobbyCode];

    // increment score of winner
    game.score_board[winner.id] += 1;

    // inform about round winner and send updated score board
    io.to(lobbyCode).emit('game:round-won-by', winner);
    io.to(lobbyCode).emit('game:round-end', game.score_board);

    // update game state to prepare for next round
    updateStateToNextRound(lobbyCode);
  };

  const czarSkippedRound = (lobbyCode) => {
    const game = games[lobbyCode];

    io.to(lobbyCode).emit('game:round-won-by');
    io.to(lobbyCode).emit('game:round-end', game.score_board);

    // update game state to prepare for next round
    updateStateToNextRound(lobbyCode);
  };

  const playerLeft = (reason) => {
    for (const lobbyCode of socket.rooms) {
      if (lobbyCode !== socket.id) {
        const game = games[lobbyCode];
        // find the player who left
        const player = game.players.find((p) => p.socket_id === socket.id);
        game.players = game.players.filter((p) => p.socket_id !== socket.id);

        // if no players are present just delete the game
        if (game.players.length > 0) {
          // inform others that a player has left
          io.to(lobbyCode).emit('game:player-left', player);

          // if the owner left then make a new owner and inform lobby
          if (player.is_owner) {
            game.players[0].is_owner = true;
            io.to(lobbyCode).emit('game:promoted-to-owner', game.players[0]);
          }

          // if score_board was initialised we have probably started the game
          if (game.score_board && game.score_board[player.id] >= 0) {
            // delete any score reference of the player who left
            delete game.score_board[player.id];

            // if the czar left then just end the round declaring it as ended
            if (player.is_czar) {
              io.to(lobbyCode).emit('game:round-won-by');
              io.to(lobbyCode).emit('game:round-end', game.score_board);

              // update game state to prepare for next round
              // note we dont need to update the czar index if the czar left
              // because the index automatically goes to the next player in line
              updateStateToNextRound(lobbyCode, true);
            } else {
              // if a non czar player left then check if everyone has played
              // if yes then ask czar to select winner?
              // not sure what happens if this triggers along with same
              // condition in game:play-cards event
              // (maybe handle on client for duplicate events)
              if (game.played_this_round.length === game.players.length - 1) {
                io.to(lobbyCode).emit('game:select-winner');
              }
            }
          }
        } else {
          delete games[lobbyCode];
        }
      }
    }
  };

  const updateStateToNextRound = (lobbyCode, skipCzarUpdate = false) => {
    const game = games[lobbyCode];

    if (skipCzarUpdate === false) {
      game.czar_index = (game.czar_index + 1) % game.players.length;
    }
    game.current_round += 1;
    game.played_this_round = [];
    game.inactive_players = [];
    game.black_cards.pop();
  };

  const shuffle = (cards) => {
    for (let i = cards.length - 1; i > 0; i--) {
      // random index from 0 to i
      let j = Math.floor(Math.random() * (i + 1));
  
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  
    return cards;
  };

  socket.on('game:start', startGame);
  socket.on('game:draw-cards', drawCards);
  socket.on('game:round-start', startRound);
  socket.on('game:play-cards', playCards);
  socket.on('game:player-skipped', playerSkippedRound);
  socket.on('game:round-winner', selectWinner);
  socket.on('game:czar-skipped', czarSkippedRound);
  socket.on('disconnecting', playerLeft);
};
