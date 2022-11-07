export class Game {
  constructor(code) {
    this.code = code;
    this.players = [];
    this.owner = null;
    this.czar = null;
    this.black_card = null;
    this.round = 1;
    this.score_board = {};
    this.played_this_round = [];
    this.idle_timeout = 30 * 1000;
  }

  addPlayer(player) {
    this.players = this.players.concat(player);
  }
}
