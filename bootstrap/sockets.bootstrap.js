const socket = {};

socket.init = function (server) {
  const { Server } = require('socket.io');

  const io = new Server(server);

  const registerLobbyHandlers = require('../sockets/lobby.socket');
  const registerGameHandlers = require('../sockets/game.socket');

  const onConnection = (socket) => {
    registerLobbyHandlers(io, socket);
    registerGameHandlers(io, socket);
  };

  io.on('connection', onConnection);
};

module.exports = socket;
