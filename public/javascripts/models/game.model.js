export class Game {
  constructor(code) {
    this.code = code;
    this.players = [];
    this.owner = null;
    this.czar = null;
    this.black_card = null;
    this.round = 1;
    this.played_this_round = [];
  }

  addPlayer(player) {
    this.players = this.players.concat(player);
  }
}
