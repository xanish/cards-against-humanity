const nanoid = require('nanoid');
const games = require('../database/models/game.model');
const defaultGameSettings = require('../config/game-settings.config');

module.exports = (io, socket) => {
  const createLobby = (player) => {
    // generate lobby id
    const lobbyCode = nanoid.nanoid(6);
    player.socket_id = socket.id;
    player.is_owner = true;

    // create game
    games[lobbyCode] = {
      players: [player],
      owner: player,
      settings: defaultGameSettings,
    };

    // join the lobby
    socket.join(lobbyCode);

    // provide owner with intimation of created lobby
    io.to(lobbyCode).emit('lobby:created', lobbyCode);
  };

  const joinLobby = (lobbyCode, player) => {
    if (games[lobbyCode]) {
      // game exists
      const game = games[lobbyCode];
      const settings = game.settings;

      if (
        settings.player_limit &&
        game.players.length === settings.player_limit
      ) {
        io.to(socket.id).emit('lobby:full', 'Lobby is full');
        return;
      }

      player.socket_id = socket.id;
      player.is_owner = false;
      game.players.push(player);

      // join the lobby
      socket.join(lobbyCode);

      // inform other players about new player
      socket.to(lobbyCode).emit('lobby:player-joined', player);

      // provide current joined user with all info
      socket.emit('lobby:joined', {
        players: game.players,
        owner: game.owner,
      });
    } else {
      // invalid lobby code
      io.to(socket.id).emit('lobby:not-found');
    }
  };

  socket.on('lobby:create', createLobby);
  socket.on('lobby:join', joinLobby);
};
