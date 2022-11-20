const express = require('express');
const router = express.Router();

/* GET packs list */
router.get('/', function (req, res, next) {
  const packs = require('./../database/data/packs.database.json');
  res.json({
    meta: {
      total: packs.length,
    },
    data: packs,
  });
});

/* GET cards list */
router.get('/-/cards', function (req, res, next) {
  let cards = require('./../database/data/cards.database.json');

  const offset =
    req.query.offset && +req.query.offset > 0 ? +req.query.offset : 0;
  const limit = req.query.limit && +req.query.limit > 0 ? +req.query.limit : 50;

  if (req.query.pack_id && req.query.pack_id.trim() !== '') {
    const packId = new Set(req.query.pack_id.trim().split(','));
    cards = cards.filter((c) => packId.has(c.pack.id));
  }

  if (req.query.search && req.query.search.trim() !== '') {
    const search = req.query.search.trim();
    cards = cards.filter((c) =>
      c.text.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.json({
    meta: {
      total: cards.length,
      from: offset,
      to: offset + limit,
    },
    data: cards.slice(offset, offset + limit),
  });
});

module.exports = router;
