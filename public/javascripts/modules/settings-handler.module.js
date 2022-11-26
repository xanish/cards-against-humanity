import { CardPackSelect } from './pack-select.module.js';

export class SettingsHandler {
  constructor(socket, state) {
    this.settings = {
      player_limit: 5,
      score_limit: 10,
      packs: [],
    };
    this.socket = socket;
    this.state = state;
    this.playerLimit = document.getElementById('player-limit');
    this.scoreLimit = document.getElementById('score-limit');
    this.packSelect = document.getElementById('packs');
    this.packSelectHandler = new CardPackSelect('packs');
    this.initPlayerLimitChangeListener();
    this.initScoreLimitChangeListener();
    this.initCardPackSelectListener();
    this.initSyncSettingsEventListener();
  }

  initPlayerLimitChangeListener() {
    this.playerLimit.addEventListener('blur', () => {
      const limit = +this.playerLimit.value;
      const errors = this.playerLimit.parentNode.querySelector(
        'label > .validation-error'
      );
      if (limit >= 3 && limit <= 20) {
        errors.textContent = '';
        this.settings.player_limit = +this.playerLimit.value;
        this.updateSettings();
      } else {
        errors.textContent = 'Number of players must be between 3 to 20';
      }
    });
  }

  initScoreLimitChangeListener() {
    this.scoreLimit.addEventListener('blur', () => {
      const limit = +this.scoreLimit.value;
      const errors = this.scoreLimit.parentNode.querySelector(
        'label > .validation-error'
      );
      if (limit >= 1 && limit <= 50) {
        errors.textContent = '';
        this.settings.score_limit = +this.scoreLimit.value;
        this.updateSettings();
      } else {
        errors.textContent = 'Max score to end game must be between 1 to 50';
      }
    });
  }

  initCardPackSelectListener() {
    const packsUpdated = (e) => {
      this.settings.packs = e.detail.all;
      this.updateSettings();
    };
    this.packSelect.addEventListener('pack-selected', packsUpdated);
    this.packSelect.addEventListener('pack-removed', packsUpdated);
  }

  initSyncSettingsEventListener() {
    this.socket.on('game:sync-settings', (settings) => {
      this.playerLimit.value = settings.player_limit;
      this.scoreLimit.value = settings.score_limit;
      this.packSelectHandler.setSelected(settings.packs);
    });
  }

  updateSettings() {
    this.socket.emit(
      'game:update-settings',
      this.state.game.code,
      this.settings
    );
  }

  getSettings() {
    return this.settings;
  }

  enableElements() {
    this.playerLimit.removeAttribute('disabled');
    this.scoreLimit.removeAttribute('disabled');
    this.packSelectHandler.enable();
  }

  disableElements() {
    this.playerLimit.setAttribute('disabled', true);
    this.scoreLimit.setAttribute('disabled', true);
    this.packSelectHandler.disable();
  }
}
