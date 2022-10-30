import { GameBoard } from './game-board.module.js';
import { PlayerHand } from './player-hand.module.js';
import { Card } from '../models/card.model.js';
import { Play } from '../models/play.model.js';
import { Player } from '../models/player.model.js';
import { Utility } from './utility.module.js';

export class GameController {
  elements = {
    // btns
    startGame: document.getElementById('start-game'),
    leaveGame: document.getElementById('leave-game'),
    playCards: document.getElementById('play-cards'),
    selectWinner: document.getElementById('select-winner'),

    // other elements
    roundNum: document.getElementById('round-number'),
    handWrapper: document.getElementById('hand'),
    gameBoardWrapper: document.getElementById(
      'game-board-select-cards-being-played'
    ),
  };
  maxCards = 10;

  constructor(socket, state) {
    this.socket = socket;
    this.state = state;
    this.gameBoard = new GameBoard('cards-being-played');
    this.playerHand = new PlayerHand('cards-in-hand');

    // btn event listeners
    this.initGameStartBtnListener();
    this.initGameLeaveBtnListener();
    this.initGamePlayCardsBtnListener();
    this.initGameSelectWinnerBtnListener();

    // socket event listeners
    this.initGameStartedEventListener();
    this.initGameDrawCardsEventListener();
    this.initGameRoundStartEventListener();
    this.initGameCardsPlayedEventListener();
    this.initGameSelectWinnerEventListener();
    this.initGameRoundWonByEventListener();
    this.initGameRoundEndEventListener();
    this.initGamePlayerLeftEventListener();
    this.initGamePlayerPromotedEventListener();
  }

  initGameStartBtnListener() {
    this.elements.startGame.addEventListener('click', () => {
      this.socket.emit('game:start', this.state.game.code);
    });
  }

  initGameLeaveBtnListener() {
    this.elements.leaveGame.addEventListener('click', () => {
      this.socket.disconnect();
      window.location = '/';
    });
  }

  initGamePlayCardsBtnListener() {
    this.elements.playCards.addEventListener('click', () => {
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
        this.elements.playCards.disabled = true;
      } else {
        Utility.popMsg(
          `Choose ${this.state.game.black_card.pick} cards to play`,
          { auto_close: true }
        );
      }
    });
  }

  initGameSelectWinnerBtnListener() {
    this.elements.selectWinner.addEventListener('click', () => {
      const play = this.gameBoard.getSelectedCards();

      if (play) {
        this.socket.emit(
          'game:round-winner',
          this.state.game.code,
          this.state.game.players.find(
            (player) => player.id === play.played_by.id
          )
        );

        this.elements.selectWinner.disabled = true;
      } else {
        Utility.popMsg(`Choose a winning card combination`, {
          auto_close: true,
        });
      }
    });
  }

  initGameStartedEventListener() {
    this.socket.on('game:started', (myTurn) => {
      this.state.player.turn = myTurn;

      setTimeout(
        () =>
          this.socket.emit(
            'game:draw-cards',
            this.state.game.code,
            this.maxCards
          ),
        myTurn * 500
      );
    });
  }

  initGameDrawCardsEventListener() {
    this.socket.on('game:cards', (cards) => {
      this.state.player.hand = cards.map(
        (card) => new Card(card.id, card.text)
      );

      this.playerHand.populate(this.state.player.hand);

      Utility.hide(this.elements.startGame);

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
        Utility.hide(this.elements.playCards);
        Utility.hide(this.elements.handWrapper);
        Utility.show(this.elements.selectWinner);
      } else {
        this.gameBoard.disable();
        this.elements.playCards.disabled = false;
        Utility.show(this.elements.playCards);
        Utility.show(this.elements.handWrapper);
        Utility.hide(this.elements.selectWinner);
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
        this.elements.selectWinner.disabled = false;
      }

      this.gameBoard.populate(this.state.game.played_this_round);
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
      let scoreNode = null;

      for (let playerId in scoreBoard) {
        scoreNode = document.querySelector(
          `span.player-score[data-player-id="${playerId}"]`
        );
        scoreNode.textContent = scoreBoard[playerId];
      }

      setTimeout(() => {
        this.state.game.played_this_round = [];
        this.playerHand.removeSelectedCards();
        this.gameBoard.reset();
        this.state.game.round += 1;

        if (this.state.player.is_czar) {
          this.socket.emit('game:round-start', this.state.game.code);
        }

        setTimeout(
          () =>
            this.socket.emit(
              'game:draw-cards',
              this.state.game.code,
              this.maxCards - this.playerHand.getCountOfCards()
            ),
          this.state.player.turn * 500
        );
      }, 5000);
    });
  }

  initGamePlayerLeftEventListener() {
    this.socket.on('game:player-left', (player) => {
      Utility.popMsg(`${player.username} has left the game`, {
        auto_close: true,
      });
      document
        .querySelector(`.players-body-item[data-player-id="${player.id}"]`)
        .remove();
    });
  }

  initGamePlayerPromotedEventListener() {
    this.socket.on('game:promoted-to-owner', (player) => {
      Utility.popMsg(`${player.username} is now the lobby owner`, {
        auto_close: true,
      });
      this.state.game.owner = player;
      this.state.player.is_owner = this.state.player.id === player.id;
      if (this.state.player.turn === -1 && this.state.player.is_owner) {
        Utility.show(this.elements.startGame);
      }
    });
  }
}
