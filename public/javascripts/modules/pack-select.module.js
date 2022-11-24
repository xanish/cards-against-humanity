import { Utility } from './utility.module.js';

class CardPackSelect {
  constructor(selectId) {
    this.packSelectId = selectId;
    this.body = document.querySelector('#packs > .body');
    this.search = document.getElementById('pack-search');
    this.selectedInfo = document.getElementById('selected-info');
    this.packs = [];
    this.filtered = [];
    this.selected = [];
    this.count = {
      black: 0,
      white: 0,
    };
    this.fetchPacks();
  }

  async fetchPacks() {
    const response = await fetch('/packs');
    const body = await response.json();
    this.packs = body.data;
    this.filtered = this.packs;

    this.populateOptions();
    this.initOptionClickListener();
    this.initSearchListener();
  }

  populateOptions() {
    this.body.innerHTML = '';
    for (let i = 0; i < this.filtered.length; i++) {
      this.body.appendChild(this.createPackOption(this.filtered[i], i));
    }
  }

  createPackOption(pack, packIndex) {
    const option = document.createElement('ul');
    option.classList.add('pack-option');
    if (this.selected.includes(pack.id)) {
      option.classList.add('selected');
    }
    option.dataset.packId = pack.id;
    option.dataset.packIndex = packIndex;

    const packName = document.createElement('li');
    const blackCardCount = document.createElement('li');
    const whiteCardCount = document.createElement('li');
    packName.textContent = pack.name;
    blackCardCount.textContent = pack.black;
    whiteCardCount.textContent = pack.white;

    option.appendChild(packName);
    option.appendChild(blackCardCount);
    option.appendChild(whiteCardCount);

    return option;
  }

  initOptionClickListener() {
    document.addEventListener('click', (e) => {
      if (this.disabled) {
        return;
      }

      if (e.target && e.target.classList.contains('pack-option')) {
        const packOption = e.target;
        if (packOption.classList.contains('selected')) {
          packOption.classList.remove('selected');
          this.selected = this.selected.filter(
            (s) => s != packOption.dataset.packId
          );
          this.count.black -= this.packs[packOption.dataset.packIndex].black;
          this.count.white -= this.packs[packOption.dataset.packIndex].white;
        } else {
          packOption.classList.add('selected');
          this.selected.push(packOption.dataset.packId);
          this.count.black += this.packs[packOption.dataset.packIndex].black;
          this.count.white += this.packs[packOption.dataset.packIndex].white;
        }
        this.updateSelectedText();
      }
    });
  }

  initSearchListener() {
    this.search.addEventListener(
      'keyup',
      Utility.delay(() => {
        this.filtered = this.packs.filter((p) =>
          p.name.toLowerCase().includes(this.search.value.toLowerCase())
        );
        this.populateOptions();
      }, 500)
    );
  }

  updateSelectedText() {
    if (this.selected.length === 0) {
      this.selectedInfo.textContent = 'Selected: None';
    } else {
      this.selectedInfo.textContent = `Selected: "${this.selected.length}" packs with "${this.count.black}" black and "${this.count.white}" white cards`;
    }
  }

  getSelected() {
    return this.selected;
  }

  disable() {
    this.disabled = true;
    this.search.setAttribute('disabled', true);
    this.body.classList.add('disabled');
  }

  enable() {
    this.disabled = false;
    this.search.removeAttribute('disabled');
    this.body.classList.remove('disabled');
  }
}
