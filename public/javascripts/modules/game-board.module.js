export class GameBoard {
  constructor(targetId) {
    this.selectId = targetId;
    this.gameBoardSelectId = `game-board-select-${targetId}`;

    // get the select and enable multi-select option if not already
    this.select = document.getElementById(targetId);
    this.select.multiple = true;

    // create our custom card group select div
    this.gameBoardSelect = document.getElementById(this.gameBoardSelectId);

    this.blackCardText = document.getElementById('black-card-text');
    this.blackCardPick = document.getElementById('black-card-pick');

    this.data = {};
    this.selected = [];
  }

  enable() {
    this.disabled = false;
    this.select.disabled = false;
    this.gameBoardSelect.classList.remove('disabled');
  }

  disable() {
    this.disabled = true;
    this.select.disabled = true;
    this.gameBoardSelect.classList.add('disabled');
  }

  setBlackCard(card) {
    this.blackCard = card;
    this.blackCardText.textContent = card.text.replace(/_/g, '____');
    this.blackCardPick.textContent = `Pick ${card.pick}`;
  }

  populate(plays) {
    for (let play of plays) {
      const relatedCardIds = play.cards.map((card) => card.id).join();

      for (let card of play.cards) {
        // append option in basic select
        const option = document.createElement('option');
        option.value = card.id;
        option.dataset.relatedCardIds = relatedCardIds;
        option.textContent = card.text;

        this.select.appendChild(option);

        // append option in our custom select
        const cardOption = document.createElement('div');
        cardOption.classList.add('game-board-select-item');
        cardOption.dataset.cardId = card.id;
        cardOption.dataset.relatedCardIds = relatedCardIds;
        cardOption.dataset.playedById = play.played_by.id;
        cardOption.textContent = card.text;
        this.gameBoardSelect.appendChild(cardOption);

        // add listener for any click events on the option
        this.initClickListener(cardOption);

        // keep a mapping of what to return when calling for selected data
        this.data[card.id] = play;
      }
    }
  }

  initClickListener(cardOption) {
    cardOption.addEventListener('click', () => {
      if (this.disabled) {
        return;
      }

      // fetch all ids that have to be selected on click of current option
      const relatedIds = cardOption.dataset.relatedCardIds.split(',');

      // select or deselect all ids
      if (this.selected.includes(cardOption.dataset.cardId)) {
        this.deselectCards(relatedIds);
      } else {
        this.selectCards(relatedIds);
      }
    });
  }

  selectCards(relatedIds) {
    // clear currently selected play before selecting a new one
    // can only select one play as winner
    this.deselectCards(this.selected);

    // perform select event on basic select and display selected
    // on custom component
    for (let id of relatedIds) {
      this.gameBoardSelect
        .querySelector(`.game-board-select-item[data-card-id="${id}"]`)
        .classList.add('selected');
      this.select.querySelector(`option[value="${id}"]`).selected = true;
    }

    // update selected
    this.selected = relatedIds;
  }

  deselectCards(relatedIds) {
    // perform deselect event on basic select and remove selected
    // from custom component
    for (let id of relatedIds) {
      this.gameBoardSelect
        .querySelector(`.game-board-select-item[data-card-id="${id}"]`)
        .classList.remove('selected');
      this.select.querySelector(`option[value="${id}"]`).selected = false;
    }

    // update selected
    this.selected = [];
  }

  highlightPlayBy(winner) {
    this.gameBoardSelect
      .querySelector(
        `.game-board-select-item[data-played-by-id="${winner.id}"]`
      )
      .classList.add('selected');
  }

  getSelectedCards() {
    // can return mapped play from any one of the selected id
    // as it contains entire data
    return this.data[this.selected[0]];
  }

  reset() {
    // clear the cards on board
    this.select.replaceChildren();
    const cards = document.querySelectorAll('.game-board-select-item');
    for (let card of cards) {
      card.remove();
    }
    this.selected = [];
  }
}
