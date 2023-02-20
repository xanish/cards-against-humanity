import { Player } from '../models/player.model.js';
import { Utility } from './utility.module.js';

export class HomeController {
  elements = {
    // inputs
    userName: document.getElementById('username'),
    lobbyCode: document.getElementById('lobby-code'),
    password: document.getElementById('lobby-password'),

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
    this.initLobbyNotFoundEventListener();
    this.initLobbyJoinFailedEventListener();
  }

  initSetUsernameBtnListener() {
    this.elements.setUser.addEventListener('click', () => {
      const username = this.elements.userName.value;

      if (username) {
        this.state.setPlayer(new Player(username));

        Utility.hide(this.elements.playerForm);
        this.elements.playerName.textContent = username;
        Utility.show(this.elements.playerInfo);
      } else {
        Utility.popMsg(`Please set a username before proceeding`, {
          auto_close: true,
        });
      }
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
        const password = this.elements.password.value;

        this.socket.emit(
          'lobby:join',
          lobbyCode,
          password,
          this.state.player.toJson()
        );

        Utility.hide(this.elements.homeTab);
      }
    });
  }

  initLobbyNotFoundEventListener() {
    this.socket.on('lobby:not-found', () => {
      Utility.show(this.elements.homeTab);
      Utility.popMsg(`Game does not exist or has ended`, { auto_close: true });
    });
  }

  initLobbyJoinFailedEventListener() {
    this.socket.on('lobby:error', (msg) => {
      Utility.show(this.elements.homeTab);
      Utility.popMsg(msg, { auto_close: true });
    });
  }

  isPlayerValid() {
    if (this.state.player == null) {
      Utility.popMsg(`Please set a username before proceeding`, {
        auto_close: true,
      });
      return false;
    }

    return true;
  }
}
