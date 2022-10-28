const socket = {};

socket.init = function (server) {
  const { Server } = require('socket.io');

  const io = new Server(server);

  const onConnection = (socket) => {};

  io.on('connection', onConnection);
};

module.exports = socket;
