export class Play {
  constructor(cards, player) {
    this.cards = cards;
    this.played_by = player;
  }

  toJson() {
    return JSON.parse(JSON.stringify(this));
  }
}
