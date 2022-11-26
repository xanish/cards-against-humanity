import { Game } from '../models/game.model.js';
import { Player } from '../models/player.model.js';
import { SettingsHandler } from './settings-handler.module.js';
import { Utility } from './utility.module.js';

export class LobbyController {
  elements = {
    // btns
    startGameBtn: document.getElementById('start-game'),

    // input fields
    playerLimit: document.getElementById('player-limit'),

    // other elements
    lobbyTab: document.getElementById('lobby'),
    lobbyCode: document.getElementById('lobby-code'),
    lobbyCodeLabel: document.getElementById('lobby-id'),
    lobbyPlayersList: document.getElementById('players-list'),
  };

  constructor(socket, state) {
    this.socket = socket;
    this.state = state;

    this.initLobbyCreatedEventListener();
    this.initLobbyJoinedEventListener();
    this.initLobbyPlayerJoinedEventListener();
    this.initGameStartBtnListener();
    this.initPlayerLeftEventListener();
    this.initPlayerPromotedEventListener();
    this.settingsHandler = new SettingsHandler(socket, state);
  }

  initLobbyCreatedEventListener() {
    this.socket.on('lobby:created', (lobbyCode) => {
      Utility.show(this.elements.lobbyTab);

      this.elements.lobbyPlayersList.appendChild(
        this.createPlayer(this.state.player)
      );

      const game = new Game(lobbyCode);
      game.addPlayer([this.state.player]);
      game.owner = this.state.player;

      this.state.setGame(game);
      this.state.player.is_owner = true;

      this.elements.lobbyCodeLabel.textContent = lobbyCode;

      // show start btn for owner
      Utility.show(this.elements.startGameBtn);
    });
  }

  initLobbyJoinedEventListener() {
    this.socket.on('lobby:joined', (data) => {
      const lobbyCode = this.elements.lobbyCode.value;

      Utility.show(this.elements.lobbyTab);
      this.settingsHandler.disableElements();

      for (let player of data.players) {
        this.elements.lobbyPlayersList.appendChild(this.createPlayer(player));
      }

      const game = new Game(lobbyCode);
      for (let player of data.players) {
        game.addPlayer(Player.fromJson(player));
      }
      game.owner = Player.fromJson(data.owner);
      this.state.setGame(game);

      this.elements.lobbyCodeLabel.textContent = lobbyCode;
    });
  }

  initLobbyPlayerJoinedEventListener() {
    this.socket.on('lobby:player-joined', (player) => {
      this.elements.lobbyPlayersList.appendChild(this.createPlayer(player));

      this.state.game.addPlayer(Player.fromJson(player));
    });
  }

  initGameStartBtnListener() {
    this.elements.startGameBtn.addEventListener('click', () => {
      this.socket.emit(
        'game:start',
        this.state.game.code,
        this.settingsHandler.getSettings()
      );
    });
  }

  initPlayerLeftEventListener() {
    this.socket.on('lobby:player-left', (player) => {
      Utility.popMsg(`${player.username} has left the game`, {
        auto_close: true,
      });
      this.state.game.removePlayer(player);
      document
        .querySelector(`.players-body-item[data-player-id="${player.id}"]`)
        .remove();
    });
  }

  initPlayerPromotedEventListener() {
    this.socket.on('lobby:promoted-to-owner', (player) => {
      Utility.popMsg(`${player.username} is now the lobby owner`, {
        auto_close: true,
      });
      this.state.game.owner = player;
      this.state.player.is_owner = this.state.player.id === player.id;
      if (this.state.player.turn === -1 && this.state.player.is_owner) {
        this.settingsHandler.enableElements();
        Utility.show(this.elements.startGameBtn);
      }
    });
  }

  createPlayer(player) {
    const li = document.createElement('li');
    const name = document.createElement('span');
    const score = document.createElement('span');

    name.appendChild(document.createTextNode(player.username));
    score.classList.add('player-score');
    score.dataset.playerId = player.id;
    score.dataset.playerUsername = player.username;
    score.appendChild(document.createTextNode(0));

    li.appendChild(name);
    li.appendChild(score);
    li.dataset.playerId = player.id;
    li.classList.add('players-body-item');

    return li;
  }
}
