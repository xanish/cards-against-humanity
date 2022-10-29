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
    this.initGamePlayCardsBtnListener();
    this.initGameSelectWinnerBtnListener();

    // socket event listeners
    this.initGameStartedEventListener();
    this.initGameDrawCardsEventListener();
    this.initGameRoundStartEventListener();
    this.initGameCardsPlayedEventListener();
    this.initGameSelectWinnerEventListener();
  }

  initGameStartBtnListener() {
    this.elements.startGame.addEventListener('click', () => {
      this.socket.emit('game:start', this.state.game.code);
    });
  }

  initGamePlayCardsBtnListener() {
    this.elements.playCards.addEventListener('click', () => {
      const cardsPlayed = this.playerHand.getSelectedCards();
      const play = new Play(cardsPlayed, this.state.player);
      this.state.player.removeFromHand(cardsPlayed);

      this.socket.emit('game:play-cards', this.state.game.code, play.toJson());
      Utility.hide(this.elements.handWrapper);
      document.getElementById('play-cards').disabled = true;
    });
  }

  initGameSelectWinnerBtnListener() {
    this.elements.selectWinner.addEventListener('click', () => {
      const play = this.gameBoard.getSelectedCards();

      this.socket.emit(
        'game:round-winner',
        this.state.game.code,
        this.state.game.players.find(
          (player) => player.id === play.played_by.id
        )
      );

      document.getElementById('select-winner').disabled = true;
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
        document.getElementById('select-winner').disabled = false;
      }

      this.gameBoard.populate(this.state.game.played_this_round);
    });
  }
}
