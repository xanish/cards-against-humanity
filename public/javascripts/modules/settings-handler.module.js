import { CardPackSelect } from './pack-select.module.js';

export class SettingsHandler {
  constructor(socket, state) {
    this.settings = {
      player_limit: 5,
    };
    this.socket = socket;
    this.state = state;
    this.playerLimit = document.getElementById('player-limit');
    this.packSelect = document.getElementById('packs');
    this.packSelectHandler = new CardPackSelect('packs');
    this.initPlayerLimitChangeListener();
    this.initCardPackSelectListener();
    this.initSyncSettingsEventListener();
  }

  initPlayerLimitChangeListener() {
    this.playerLimit.addEventListener('blur', () => {
      this.settings.player_limit = +this.playerLimit.value;
      this.updateSettings();
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
    this.packSelectHandler.enable();
  }

  disableElements() {
    this.playerLimit.setAttribute('disabled', true);
    this.packSelectHandler.disable();
  }
}
