export class Game {
  constructor(code) {
    this.code = code;
    this.players = [];
    this.owner = null;
  }

  addPlayer(player) {
    this.players = this.players.concat(player);
  }
}
