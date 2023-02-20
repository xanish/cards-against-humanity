import { GameBoard } from './game-board.module.js';
import { PlayerHand } from './player-hand.module.js';
import { Card } from '../models/card.model.js';
import { Play } from '../models/play.model.js';
import { Player } from '../models/player.model.js';
import { Utility } from './utility.module.js';

export class GameController {
  elements = {
    // btns
    startGameBtn: document.getElementById('start-game'),
    leaveGameBtn: document.getElementById('leave-game'),
    playCardsBtn: document.getElementById('play-cards'),
    selectWinnerBtn: document.getElementById('select-winner'),

    // other elements
    idleTimer: document.getElementById('idle-timer'),
    settings: document.getElementById('settings'),
    playArea: document.getElementById('board'),
    roundNum: document.getElementById('round-number'),
    handWrapper: document.getElementById('hand'),
    gameBoardWrapper: document.getElementById(
      'game-board-select-cards-being-played'
    ),
  };
  maxCards = 10;
  czarIdleTimeout = null;
  playerIdleTimeout = null;

  constructor(socket, state) {
    this.socket = socket;
    this.state = state;
    this.gameBoard = new GameBoard('cards-being-played');
    this.playerHand = new PlayerHand('cards-in-hand');

    // btn event listeners
    this.initGameLeaveBtnListener();
    this.initGamePlayCardsBtnListener();
    this.initGameSelectWinnerBtnListener();

    // socket event listeners
    this.initGameErrorEventListener();
    this.initGameStartedEventListener();
    this.initGameDrawCardsEventListener();
    this.initGameRoundStartEventListener();
    this.initGameCardsPlayedEventListener();
    this.initGameSelectWinnerEventListener();
    this.initGameRoundWonByEventListener();
    this.initGameRoundEndEventListener();
    this.initGameFinishEventListener();
  }

  initGameLeaveBtnListener() {
    this.elements.leaveGameBtn.addEventListener('click', () => {
      this.socket.disconnect();
      window.location = '/';
    });
  }

  initGamePlayCardsBtnListener() {
    this.elements.playCardsBtn.addEventListener('click', () => {
      // clear idle timeout if action made by player
      this.playerIdleTimeout.reset();
      const cardsPlayed = this.playerHand.getSelectedCards();
      if (cardsPlayed.length === this.state.game.black_card.pick) {
        const play = new Play(cardsPlayed, this.state.player);
        this.state.player.removeFromHand(cardsPlayed);

        this.socket.emit(
          'game:play-cards',
          this.state.game.code,
          play.toJson()
        );
        Utility.hide(this.elements.handWrapper);
        this.elements.playCardsBtn.disabled = true;
      } else {
        Utility.popMsg(
          `Choose ${this.state.game.black_card.pick} cards to play`,
          { auto_close: true }
        );
      }
    });
  }

  initGameSelectWinnerBtnListener() {
    this.elements.selectWinnerBtn.addEventListener('click', () => {
      // clear idle timeout if action made by czar
      this.czarIdleTimeout.reset();
      const play = this.gameBoard.getSelectedCards();

      if (play) {
        this.socket.emit(
          'game:round-winner',
          this.state.game.code,
          this.state.game.players.find(
            (player) => player.id === play.played_by.id
          )
        );

        this.elements.selectWinnerBtn.disabled = true;
      } else {
        Utility.popMsg(`Choose a winning card combination`, {
          auto_close: true,
        });
      }
    });
  }

  initGameErrorEventListener() {
    this.socket.on('game:error', (msg) => {
      Utility.popMsg(msg, { auto_close: true });
    });
  }

  initGameStartedEventListener() {
    this.socket.on('game:started', (myTurn) => {
      this.state.player.turn = myTurn;
      Utility.hide(this.elements.startGameBtn);
      Utility.hide(this.elements.settings);
      Utility.show(this.elements.playArea);
      Utility.show(this.elements.idleTimer);

      // owner asks server to distribute cards
      // when game begins
      if (this.state.player.is_owner) {
        this.socket.emit(
          'game:draw-cards',
          this.state.game.code,
          this.maxCards
        );
      }
    });
  }

  initGameDrawCardsEventListener() {
    this.socket.on('game:cards', (cards) => {
      this.state.player.hand = cards.map(
        (card) => new Card(card.id, card.text)
      );

      this.playerHand.populate(this.state.player.hand);

      this.socket.emit('game:round-start', this.state.game.code);
    });
  }

  initGameRoundStartEventListener() {
    this.socket.on('game:round-started', (round, czar, blackCard) => {
      this.elements.roundNum.textContent = `Round ${round}`;
      this.state.game.czar = czar;
      this.state.player.is_czar = czar.id == this.state.player.id;

      this.state.game.black_card = new Card(
        blackCard.id,
        blackCard.text,
        blackCard.pick
      );
      this.gameBoard.setBlackCard(this.state.game.black_card);
      this.playerHand.setMaxAllowedPicks(blackCard.pick);
      Utility.show(this.elements.gameBoardWrapper);

      if (this.state.player.is_czar) {
        this.gameBoard.enable();
        Utility.hide(this.elements.playCardsBtn);
        Utility.hide(this.elements.handWrapper);
        Utility.show(this.elements.selectWinnerBtn);
      } else {
        this.gameBoard.disable();
        this.elements.playCardsBtn.disabled = false;
        Utility.show(this.elements.playCardsBtn);
        Utility.show(this.elements.handWrapper);
        Utility.hide(this.elements.selectWinnerBtn);

        // keep an action timeout for player to make sure any
        // idle player does not keep others waiting
        this.playerIdleTimeout = Utility.executeAfterCountdown(() => {
          this.elements.playCardsBtn.disabled = true;
          this.socket.emit(
            'game:player-skipped',
            this.state.game.code,
            this.state.player
          );
        }, this.state.game.idle_timeout);
      }
    });
  }

  initGameCardsPlayedEventListener() {
    this.socket.on('game:cards-played', (cardsPlayed) => {
      this.state.game.played_this_round =
        this.state.game.played_this_round.concat(
          new Play(
            cardsPlayed.cards.map((card) => new Card(card.id, card.text)),
            Player.fromJson(cardsPlayed.played_by)
          )
        );
    });
  }

  initGameSelectWinnerEventListener() {
    this.socket.on('game:select-winner', () => {
      if (this.state.player.is_czar) {
        this.elements.selectWinnerBtn.disabled = false;
      }

      this.gameBoard.populate(this.state.game.played_this_round);

      // keep an action timeout for czar to end the round as draw if
      // czar is inactive
      if (this.state.player.is_czar) {
        this.czarIdleTimeout = Utility.executeAfterCountdown(() => {
          this.elements.selectWinnerBtn.disabled = true;
          this.socket.emit('game:czar-skipped', this.state.game.code);
        }, this.state.game.idle_timeout);
      }
    });
  }

  initGameRoundWonByEventListener() {
    this.socket.on('game:round-won-by', (winner) => {
      if (winner == null) {
        Utility.popMsg('No winner declared this round', { auto_close: true });
      } else {
        this.gameBoard.highlightPlayBy(winner);
        Utility.popMsg(`${winner.username} won the round!`, {
          auto_close: true,
        });
      }
    });
  }

  initGameRoundEndEventListener() {
    this.socket.on('game:round-end', (scoreBoard) => {
      this.updateScores(scoreBoard);

      this.state.game.played_this_round = [];
      this.playerHand.removeSelectedCards();
      this.gameBoard.reset();
      this.state.game.round += 1;

      if (this.state.player.is_czar) {
        // mark this player as not czar anymore
        this.state.player.is_czar = false;
        this.socket.emit(
          'game:draw-cards',
          this.state.game.code,
          this.maxCards
        );
      }
    });
  }

  initGameFinishEventListener() {
    this.socket.on('game:finish', (msg) => {
      // reset game board and player hand
      this.gameBoard.reset();
      this.playerHand.reset();

      // reset counter
      if (this.czarIdleTimeout) {
        this.czarIdleTimeout.reset();
      }
      if (this.playerIdleTimeout) {
        this.playerIdleTimeout.reset();
      }

      // reset to setting page
      if (this.state.player.is_owner) {
        Utility.show(this.elements.startGameBtn);
      }
      Utility.show(this.elements.settings);
      Utility.hide(this.elements.playArea);
      Utility.hide(this.elements.idleTimer);

      // reset round label
      this.elements.roundNum.textContent = '';

      // reset score board
      const scoreBoard = {};
      for (let player of this.state.game.players) {
        scoreBoard[player.id] = 0;
      }
      this.updateScores(scoreBoard);

      // reset state, player and game
      this.state.reset();

      // display game ended with winner message
      Utility.popMsg(msg, { auto_close: true });
    });
  }

  updateScores(scoreBoard) {
    let scoreNode = null;

    for (let playerId in scoreBoard) {
      scoreNode = document.querySelector(
        `span.player-score[data-player-id="${playerId}"]`
      );
      if (scoreNode) {
        scoreNode.textContent = scoreBoard[playerId];
      }
    }
  }
}
