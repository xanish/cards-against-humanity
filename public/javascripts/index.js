import { State } from './models/state.model.js';
import { HomeController } from './modules/home-controller.module.js';

class App {
  constructor() {
    this.state = new State();
    this.socket = io();
  }

  run() {
    this.home = new HomeController(this.socket, this.state);
  }
}

new App().run();
