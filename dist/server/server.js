'use strict';

var _express = _interopRequireDefault(require("express"));

var _http = _interopRequireDefault(require("http"));

var _socket = _interopRequireDefault(require("socket.io"));

var _compression = _interopRequireDefault(require("compression"));

var _utils = require("../shared/utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

var app = (0, _express.default)();

var server = _http.default.Server(app);

var io = new _socket.default(server);
var port = process.env.PORT || 3000;
var users = [];
var sockets = {};
app.use((0, _compression.default)({}));
app.use(_express.default['static'](__dirname + '/../client'));
io.on('connection', function (socket) {
  var nick = socket.handshake.query.nick;
  var currentUser = {
    id: socket.id,
    nick: nick
  };

  if ((0, _utils.findIndex)(users, currentUser.id) > -1) {
    console.log('[INFO] User ID is already connected, kicking.');
    socket.disconnect();
  } else if (!(0, _utils.validNick)(currentUser.nick)) {
    socket.disconnect();
  } else {
    console.log('[INFO] User ' + currentUser.nick + ' connected!');
    sockets[currentUser.id] = socket;
    users.push(currentUser);
    io.emit('userJoin', {
      nick: currentUser.nick
    });
    console.log('[INFO] Total users: ' + users.length);
  }

  socket.on('ding', function () {
    socket.emit('dong');
  });
  socket.on('disconnect', function () {
    if ((0, _utils.findIndex)(users, currentUser.id) > -1) users.splice((0, _utils.findIndex)(users, currentUser.id), 1);
    console.log('[INFO] User ' + currentUser.nick + ' disconnected!');
    socket.broadcast.emit('userDisconnect', {
      nick: currentUser.nick
    });
  });
  socket.on('userChat', function (data) {
    var _nick = (0, _utils.sanitizeString)(data.nick);

    var _message = (0, _utils.sanitizeString)(data.message);

    var date = new Date();
    var time = ("0" + date.getHours()).slice(-2) + ("0" + date.getMinutes()).slice(-2);
    console.log('[CHAT] [' + time + '] ' + _nick + ': ' + _message);
    socket.broadcast.emit('serverSendUserChat', {
      nick: _nick,
      message: _message
    });
  });
});server.listen(port, function () {
  console.log('[INFO] Listening on *:' + port);
});
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(app, "app", "D:\\Development\\roketz\\src\\server\\server.js");
  reactHotLoader.register(server, "server", "D:\\Development\\roketz\\src\\server\\server.js");
  reactHotLoader.register(io, "io", "D:\\Development\\roketz\\src\\server\\server.js");
  reactHotLoader.register(port, "port", "D:\\Development\\roketz\\src\\server\\server.js");
  reactHotLoader.register(users, "users", "D:\\Development\\roketz\\src\\server\\server.js");
  reactHotLoader.register(sockets, "sockets", "D:\\Development\\roketz\\src\\server\\server.js");
  leaveModule(module);
})();

;