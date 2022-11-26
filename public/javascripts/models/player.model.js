export class Player {
  constructor(username) {
    this.id = `${username.replace(' ', '_')}_${new Date().getTime()}`;
    this.username = username;
    this.is_owner = false;
    this.is_czar = false;
    this.turn = -1;
    this.cards = [];
  }

  get hand() {
    return this.cards;
  }

  set hand(cards) {
    this.cards = this.cards.concat(cards);
  }

  removeFromHand(cards) {
    for (let card of cards) {
      this.cards = this.cards.filter((c) => c.id !== card.id);
    }
  }

  reset() {
    this.cards = [];
    this.turn = -1;
    this.is_czar = false;
  }

  toJson() {
    return JSON.parse(JSON.stringify(this));
  }

  static fromJson(json) {
    const player = new Player(json.username);

    player.id = json.id;
    player.is_owner = json.is_owner;
    player.is_czar = json.is_czar;

    return player;
  }
}
