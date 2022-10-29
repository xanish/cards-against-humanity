import { PlayerHand } from './player-hand.module.js';
import { Card } from '../models/card.model.js';
import { Utility } from './utility.module.js';

export class GameController {
  elements = {
    startGame: document.getElementById('start-game'),
  };
  maxCards = 10;

  constructor(socket, state) {
    this.socket = socket;
    this.state = state;
    this.playerHand = new PlayerHand('cards-in-hand');

    // btn event listeners
    this.initGameStartBtnListener();

    // socket event listeners
    this.initGameStartedEventListener();
    this.initGameDrawCardsEventListener();
  }

  initGameStartBtnListener() {
    this.elements.startGame.addEventListener('click', () => {
      this.socket.emit('game:start', this.state.game.code);
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
}
