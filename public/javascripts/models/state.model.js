export class State {
  constructor() {}

  setPlayer(player) {
    this.player = player;
  }

  setGame(game) {
    this.game = game;
  }

  reset() {
    this.player.reset();
    this.game.reset();
  }
}
