const games = require('../database/models/game.model');
const packs = require('../database/models/pack.model');

module.exports = (io, socket) => {
  const updateSettings = (lobbyCode, settings) => {
    if (settings) {
      const game = games[lobbyCode];
      game.settings = {
        ...game.settings,
        ...settings,
      };

      // send only to other sockets in room
      // no need to share password
      socket.to(lobbyCode).emit('game:sync-settings', {
        player_limit: game.settings.player_limit,
        score_limit: game.settings.score_limit,
        idle_time_multiplier: game.settings.idle_time_multiplier,
        packs: game.settings.packs,
      });
    }
  };

  const startGame = (lobbyCode, settings) => {
    resetGameState(lobbyCode);

    const game = games[lobbyCode];
    const players = game.players;

    if (players.length < 3) {
      io.to(lobbyCode).emit(
        'game:error',
        'Cannot start game with less than 3 players'
      );
      return;
    }

    for (let player of players) {
      game.score_board[player.id] = 0;
      player.hand = [];
    }
    game.black_cards = packs.blackCards(settings.packs, true);
    game.white_cards = packs.whiteCards(settings.packs, true);
    game.settings = {
      ...game.settings,
      ...settings,
    };

    // predecide the turn order in which players move for actions
    // like drawing cards
    let turnOrder = 0;
    for (let player of players) {
      io.to(player.socket_id).emit('game:started', turnOrder++);
    }
  };

  const drawCards = (lobbyCode, maxCardCount) => {
    const game = games[lobbyCode];

    for (let player of game.players) {
      let cardsToSend = [];
      const cardsToGive = maxCardCount - player.hand.length;
      // todo: extract card draw logic to its own function
      if (cardsToGive > 0) {
        cardsToSend = game.white_cards.slice(0, cardsToGive);
        player.hand = [...player.hand, ...cardsToSend];
        game.white_cards = game.white_cards.slice(cardsToGive);
      }

      io.to(player.socket_id).emit('game:cards', cardsToSend);
    }
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
    const playedCardIds = playedCards.cards.map((pc) => pc.id);
    const player = game.players.find((p) => p.socket_id === socket.id);

    // filter out the cards which were played from the players hand
    // keep track of this since we need to replenish his cards on round end
    // maybe this could just be a simple count? but for now maybe just
    // keep all cards he has, maybe we use it in future to implement player reconnect
    player.hand = player.hand.filter((c) => !playedCardIds.includes(c.id));

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

    // if max score reached score limit end the game
    const winningPlayerId = shouldEndGame(lobbyCode);
    if (winningPlayerId !== -1) {
      resetGameState(lobbyCode);
      const winningPlayer = game.players.find((p) => p.id === winningPlayerId);
      io.to(lobbyCode).emit(
        'game:finish',
        `${winningPlayer.username} won the game!`
      );
    } else {
      // update game state to prepare for next round
      updateStateToNextRound(lobbyCode);

      // inform about round winner and send updated score board
      io.to(lobbyCode).emit('game:round-won-by', winner);
      io.to(lobbyCode).emit('game:round-end', game.score_board);
    }
  };

  const czarSkippedRound = (lobbyCode) => {
    const game = games[lobbyCode];

    // update game state to prepare for next round
    updateStateToNextRound(lobbyCode);

    io.to(lobbyCode).emit('game:round-won-by');
    io.to(lobbyCode).emit('game:round-end', game.score_board);
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
          io.to(lobbyCode).emit('lobby:player-left', player);

          // if the owner left then make a new owner and inform lobby
          if (player.is_owner) {
            game.players[0].is_owner = true;
            io.to(lobbyCode).emit('lobby:promoted-to-owner', game.players[0]);
          }

          // if score_board was initialised we have probably started the game
          if (game.score_board && game.score_board[player.id] >= 0) {
            // delete any score reference of the player who left
            delete game.score_board[player.id];

            // if the czar left then just end the round declaring it as ended
            if (player.is_czar) {
              // update game state to prepare for next round
              // note we dont need to update the czar index if the czar left
              // because the index automatically goes to the next player in line
              updateStateToNextRound(lobbyCode, true);

              io.to(lobbyCode).emit('game:round-won-by');
              io.to(lobbyCode).emit('game:round-end', game.score_board);
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

  const shouldEndGame = (lobbyCode) => {
    const game = games[lobbyCode];

    // find max score and the player holding the current max score
    let maxScore = -1;
    let winningPlayerId = -1;
    for (let playerId in game.score_board) {
      if (game.score_board[playerId] > maxScore) {
        maxScore = game.score_board[playerId];
        winningPlayerId = playerId;
      }
    }

    return maxScore >= game.settings.score_limit ? winningPlayerId : -1;
  };

  const resetGameState = (lobbyCode) => {
    const defaults = {
      czar_index: 0,
      current_round: 1,
      played_this_round: [],
      score_board: {},
      black_cards: [],
      white_cards: [],
    };
    const game = games[lobbyCode];

    games[lobbyCode] = {
      ...game,
      ...defaults,
    };
  };

  socket.on('game:update-settings', updateSettings);
  socket.on('game:start', startGame);
  socket.on('game:draw-cards', drawCards);
  socket.on('game:round-start', startRound);
  socket.on('game:play-cards', playCards);
  socket.on('game:player-skipped', playerSkippedRound);
  socket.on('game:round-winner', selectWinner);
  socket.on('game:czar-skipped', czarSkippedRound);
  socket.on('disconnecting', playerLeft);
};
