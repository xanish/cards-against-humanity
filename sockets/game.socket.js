const games = require('../database/models/game.model');
const cardPacks = require('../database/data/cah-cards-full-official-only.json');

module.exports = (io, socket) => {
  const startGame = (lobbyCode) => {
    const game = games[lobbyCode];
    const players = game.players;

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

  socket.on('game:start', startGame);
  socket.on('game:draw-cards', drawCards);
};
