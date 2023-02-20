const path = require('path');
const fs = require('fs');

const data = require('./data/cah-cards-full-official-only.json');

const [packsWithCards, cardPacks, cardsOnly] = [[], [], []];
let [packId, blackCardId, whiteCardId] = [1, 1, 1];

for (let pack of data) {
  const packCode = `CAHP${String(packId).padStart(6, '0')}`;
  const parsedPack = {
    id: packCode,
    name: pack.name,
    black: [],
    white: [],
    official: pack.official,
  };

  for (let blackCard of pack.black) {
    const card = {
      id: `CAHBC${String(blackCardId).padStart(5, '0')}`,
      text: blackCard.text,
      pick: blackCard.pick,
      pack: {
        id: packCode,
        name: pack.name,
      },
    };
    parsedPack.black.push(card);
    cardsOnly.push(card);
    blackCardId++;
  }

  for (let whiteCard of pack.white) {
    const card = {
      id: `CAHWC${String(whiteCardId).padStart(5, '0')}`,
      text: whiteCard.text,
      pack: {
        id: packCode,
        name: pack.name,
      },
    };
    parsedPack.white.push(card);
    cardsOnly.push(card);
    whiteCardId++;
  }

  packsWithCards.push(parsedPack);
  cardPacks.push({
    id: packCode,
    name: pack.name,
    black: parsedPack.black.length,
    white: parsedPack.white.length,
    official: pack.official,
  });
  packId++;
}

fs.writeFile(
  path.join(__dirname, 'data/packs-with-cards.database.json'),
  JSON.stringify(packsWithCards),
  'utf8',
  (err) => {
    if (err) {
      console.log(
        `Failed to write data/packs-with-cards.database.json: ${err}`
      );
    }
  }
);

fs.writeFile(
  path.join(__dirname, 'data/packs.database.json'),
  JSON.stringify(cardPacks),
  'utf8',
  (err) => {
    if (err) {
      console.log(`Failed to write data/packs.database.json: ${err}`);
    }
  }
);

fs.writeFile(
  path.join(__dirname, 'data/cards.database.json'),
  JSON.stringify(cardsOnly),
  'utf8',
  (err) => {
    if (err) {
      console.log(`Failed to write data/cards.database.json: ${err}`);
    }
  }
);
