import { CardPackSelect } from './modules/pack-select.module.js';
import { Utility } from './modules/utility.module.js';

class Packs {
  constructor() {
    this.searchText = '';
    this.selectedPacks = [];
    this.packSearch = document.getElementById('search');
    this.packSelect = document.getElementById('packs');
    this.packSelectHandler = new CardPackSelect('packs');
  }

  run() {
    this.initCardSearchListener();
    this.initCardPackSelectListener();
  }

  initCardSearchListener() {
    this.packSearch.addEventListener(
      'keyup',
      Utility.delay(() => {
        this.searchText = this.packSearch.value.trim();
        this.filterRows();
      }, 500)
    );
  }

  initCardPackSelectListener() {
    const packsUpdated = (e) => {
      this.selectedPacks = e.detail.all;
      this.filterRows();
    };
    this.packSelect.addEventListener('pack-selected', packsUpdated);
    this.packSelect.addEventListener('pack-removed', packsUpdated);
  }

  filterRows() {
    if (this.selectedPacks.length === 0 && this.searchText === '') {
      document
        .querySelectorAll('tr[data-pack-id]')
        .forEach((el) => el.classList.remove('hidden'));
    } else {
      let filteredRows = [];

      if (this.selectedPacks.length > 0) {
        this.selectedPacks.forEach((pack) => {
          filteredRows = filteredRows.concat(
            Array.from(document.querySelectorAll(`tr[data-pack-id=${pack}]`))
          );
        });
      } else {
        filteredRows = Array.from(
          document.querySelectorAll('tr[data-pack-id]')
        );
      }

      if (this.searchText !== '') {
        const pattern = new RegExp(this.searchText, 'i');
        filteredRows = filteredRows.filter((row) =>
          row.getAttribute('data-card-text').match(pattern)
        );
      }

      // hide all rows before showing filtered data
      document
        .querySelectorAll('tr[data-pack-id]')
        .forEach((el) => el.classList.add('hidden'));
      filteredRows.forEach((el) => el.classList.remove('hidden'));
    }
  }
}

new Packs().run();
