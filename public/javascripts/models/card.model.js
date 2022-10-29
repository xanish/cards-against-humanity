export class Card {
  constructor(id, text, pick) {
    this.id = id;
    this.text = text;
    this.pick = pick;
    this.type = pick > 0 ? 'black' : 'white';
  }
}
