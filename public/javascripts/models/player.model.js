export class Player {
  constructor(username) {
    this.id = `${username.replace(' ', '_')}_${new Date().getTime()}`;
    this.username = username;
    this.is_owner = false;
    this.turn = 0;
    this.cards = [];
  }

  get hand() {
    return this.cards;
  }

  set hand(cards) {
    this.cards = this.cards.concat(cards);
  }

  toJson() {
    return JSON.parse(JSON.stringify(this));
  }

  static fromJson(json) {
    const player = new Player(json.username);

    player.id = json.id;
    player.is_owner = json.is_owner;

    return player;
  }
}
