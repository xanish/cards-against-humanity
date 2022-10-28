import { Player } from '../models/player.model.js';
import { Utility } from './utility.module.js';

export class HomeController {
  elements = {
    // inputs
    userName: document.getElementById('username'),
    lobbyCode: document.getElementById('lobby-code'),

    // btns
    setUser: document.getElementById('set-username'),
    createNew: document.getElementById('create-new'),
    joinExisting: document.getElementById('join-existing'),

    // other elements
    homeTab: document.getElementById('home'),
    playerName: document.getElementById('player-name'),
    playerInfo: document.getElementById('player-info'),
    playerForm: document.getElementById('player-form'),
  };

  constructor(socket, state) {
    this.socket = socket;
    this.state = state;

    this.initSetUsernameBtnListener();
    this.initCreateNewLobbyBtnListener();
    this.initJoinExistingLobbyBtnListener();
    this.initGameNotFoundEventListener();
  }

  initSetUsernameBtnListener() {
    this.elements.setUser.addEventListener('click', () => {
      const username = this.elements.userName.value;
      this.state.setPlayer(new Player(username));

      Utility.hide(this.elements.playerForm);
      this.elements.playerName.textContent = username;
      Utility.show(this.elements.playerInfo);
    });
  }

  initCreateNewLobbyBtnListener() {
    this.elements.createNew.addEventListener('click', () => {
      if (this.isPlayerValid()) {
        this.socket.emit('lobby:create', this.state.player.toJson());

        Utility.hide(this.elements.homeTab);
      }
    });
  }

  initJoinExistingLobbyBtnListener() {
    this.elements.joinExisting.addEventListener('click', () => {
      if (this.isPlayerValid()) {
        const lobbyCode = this.elements.lobbyCode.value;

        this.socket.emit('lobby:join', lobbyCode, this.state.player.toJson());

        Utility.hide(this.elements.homeTab);
      }
    });
  }

  initGameNotFoundEventListener() {
    this.socket.on('lobby:not-found', () => {
      Utility.show(this.elements.homeTab);
      Utility.popMsg(`Game does not exist or has ended.`, { auto_close: true });
    });
  }

  isPlayerValid() {
    if (this.state.player == null) {
      Utility.popMsg(`Please set a username before proceeding.`, {
        auto_close: true,
      });
      return false;
    }

    return true;
  }
}
