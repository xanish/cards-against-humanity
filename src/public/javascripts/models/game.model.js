export const GAME_STATE = {
  NONE: 0,
  LOBBY: 1,
  ONGOING: 2,
};

export class Game {
  BASE_TIMEOUT = 30;

  constructor(code) {
    this.code = code;
    this.players = [];
    this.owner = null;
    this.czar = null;
    this.black_card = null;
    this.round = 1;
    this.score_board = {};
    this.played_this_round = [];
    this.idle_timeout = this.BASE_TIMEOUT;
    this.settings = {
      player_limit: 5,
      score_limit: 10,
      idle_time_multiplier: 1,
      packs: [],
    };
    this.state = GAME_STATE.NONE;
  }

  addPlayer(player) {
    this.players = this.players.concat(player);
  }

  removePlayer(player) {
    this.players = this.players.filter((p) => p.id !== player.id);
  }

  updateSettings(settings) {
    this.settings = settings;
    this.idle_timeout = this.BASE_TIMEOUT * this.settings.idle_time_multiplier;
  }

  reset() {
    this.czar = null;
    this.black_card = null;
    this.round = 1;
    this.score_board = {};
    this.played_this_round = [];
    this.idle_timeout = this.BASE_TIMEOUT;
    this.settings = {
      player_limit: 5,
      score_limit: 10,
      idle_time_multiplier: 1,
      packs: [],
    };
    this.state = GAME_STATE.NONE;
  }
}
