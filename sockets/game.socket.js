const games = require('../database/models/game.model');
const cardPacks = require('../database/data/cah-cards-full-official-only.json');

module.exports = (io, socket) => {
  const startGame = (lobbyCode) => {
    const game = games[lobbyCode];
    const players = game.players;

    game.czar_index = 0;
    game.current_round = 1;
    game.played_this_round = [];
    game.score_board = {};
    for (let player of players) {
      game.score_board[player.id] = 0;
    }

    // todo: add logic to select from all packs / allow user to select packs
    // todo: extract the card deck creation and shuffling logic to its own function
    let blackCards = cardPacks[13].black.sort(() => 0.5 - Math.random());
    let whiteCards = cardPacks[13].white.sort(() => 0.5 - Math.random());

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

  const selectWinner = (lobbyCode, winner) => {
    const game = games[lobbyCode];

    // increment score of winner
    game.score_board[winner.id] += 1;

    // inform about round winner and send updated score board
    io.to(lobbyCode).emit('game:round-won-by', winner);
    io.to(lobbyCode).emit('game:round-end', game.score_board);

    // update game state to prepare for next round
    game.czar_index = (game.czar_index + 1) % game.players.length;
    game.current_round += 1;
    game.played_this_round = [];
    game.black_cards.pop();
  };

  socket.on('game:start', startGame);
  socket.on('game:draw-cards', drawCards);
  socket.on('game:round-start', startRound);
  socket.on('game:play-cards', playCards);
  socket.on('game:round-winner', selectWinner);
};
