const cardPacks = require('./../data/packs-with-cards.database.json');

const blackCards = (packs = [], shuffle = false) => {
  if (packs.length === 0) {
    const cards = cardPacks.map((p) => p.black).flat(1);
    return shuffle ? shuffleCards(cards) : cards;
  }

  packs = new Set(packs);

  const cards = cardPacks
    .filter((p) => packs.has(p.id))
    .map((p) => p.black)
    .flat(1);
  return shuffle ? shuffleCards(cards) : cards;
};

const whiteCards = (packs = [], shuffle = false) => {
  if (packs.length === 0) {
    const cards = cardPacks.map((p) => p.white).flat(1);
    return shuffle ? shuffleCards(cards) : cards;
  }

  packs = new Set(packs);

  const cards = cardPacks
    .filter((p) => packs.has(p.id))
    .map((p) => p.white)
    .flat(1);
  return shuffle ? shuffleCards(cards) : cards;
};

const shuffleCards = (cards) => {
  for (let i = cards.length - 1; i > 0; i--) {
    // random index from 0 to i
    let j = Math.floor(Math.random() * (i + 1));

    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
};

module.exports = {
  blackCards,
  whiteCards,
  shuffleCards,
};
