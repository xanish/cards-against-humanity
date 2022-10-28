export class Player {
  constructor(username) {
    this.id = `${username.replace(' ', '_')}_${new Date().getTime()}`;
    this.username = username;
  }

  toJson() {
    return JSON.parse(JSON.stringify(this));
  }
}
