export class PlayerHand {
  constructor(targetId) {
    this.selectId = targetId;
    this.playerHandId = `#player-hand-${targetId}`;

    // get the select and enable multi-select option if not already
    this.select = document.getElementById(targetId);
    this.select.multiple = true;

    // create our custom card select div
    this.playerHand = document.createElement('div');
    this.playerHand.id = this.playerHandId;
    this.playerHand.classList.add('player-hand');

    this.select.parentElement.appendChild(this.playerHand);

    this.data = {};
    this.selected = [];
    this.maxAllowedSelections = 1;
  }

  setMaxAllowedPicks(pick) {
    this.maxAllowedSelections = pick;
  }

  getCountOfCards() {
    return this.select.querySelectorAll('option').length;
  }

  populate(cards) {
    this.reset();

    for (let card of cards) {
      // append option in basic select
      const option = document.createElement('option');
      option.value = card.id;
      option.textContent = card.text;

      this.select.appendChild(option);

      // append option in our custom select
      const cardOption = document.createElement('div');
      cardOption.classList.add('player-hand-item');
      cardOption.dataset.cardId = card.id;
      cardOption.textContent = card.text;
      this.playerHand.appendChild(cardOption);

      // add listener for any click events on the option
      this.initClickListener(cardOption);

      // keep a mapping of what to return when calling for selected data
      this.data[card.id] = card;
    }
  }

  initClickListener(cardOption) {
    cardOption.addEventListener('click', () => {
      if (this.selected.includes(cardOption.dataset.cardId)) {
        this.deselectCard(cardOption);
      } else {
        this.selectCard(cardOption);
      }
    });
  }

  selectCard(cardOption) {
    // if only one card is selected reset it and allow another one to be
    // selected if player desires so, makes it easier to use
    if (this.maxAllowedSelections === 1 && this.selected.length === 1) {
      const selectedOption = this.playerHand.querySelector(
        `.player-hand-item[data-card-id="${this.selected[0]}"]`
      );
      this.deselectCard(selectedOption);
    }

    if (this.maxAllowedSelections === this.selected.length) {
      return;
    }

    // highlight selected card
    cardOption.classList.add('selected');

    // mark card as selected on internal select
    this.select.querySelector(
      `option[value="${cardOption.dataset.cardId}"]`
    ).selected = true;

    // save in selected array for quick access
    this.selected.push(cardOption.dataset.cardId);
  }

  deselectCard(cardOption) {
    // remove highlight from selected card
    cardOption.classList.remove('selected');

    // mark card as un-selected on internal select
    this.select.querySelector(
      `option[value="${cardOption.dataset.cardId}"]`
    ).selected = false;

    // remove card from selected array
    this.selected = this.selected.filter(
      (s) => s !== cardOption.dataset.cardId
    );
  }

  getSelectedCards() {
    // return full data for selected cards
    return this.selected.map((cardId) => this.data[cardId]);
  }

  removeSelectedCards() {
    for (let id of this.selected) {
      // remove card from internal select and card select
      this.select.removeChild(
        this.select.querySelector(`option[value="${id}"]`)
      );
      this.playerHand.removeChild(
        document.querySelector(`.player-hand-item[data-card-id="${id}"]`)
      );
    }
    this.selected = [];
  }

  reset() {
    // reset entire select
    this.select.replaceChildren();
    this.playerHand.replaceChildren();
    this.selected = [];
  }
}
