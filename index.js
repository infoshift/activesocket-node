/**
 * @constructor
 *
 * Creates a room instance used to store
 * ActiveSocketConnection instances.
 *
 * options:
 *   name {string}
 *   members {hash}
 */
var ActiveSocketRoom = function(options) {
  this._options = options;
  this.name = options.name;
  this.members = options.members || {};
};

ActiveSocketRoom.prototype.join = function(conn_name, conn) {
  this.members[conn_name] = conn;
  conn.rooms_joined[this.name] = conn_name;
};

ActiveSocketRoom.prototype.leave = function(connId) {
  delete this.members[connId]
};

ActiveSocketRoom.prototype.broadcast = function(namespace, data) { 
  for(var id in this.members) {
    this.members[id].emit(namespace, data);
  }
};

/**
 * @method
 *
 * emit to a specific connection id
 *
 */
ActiveSocketRoom.prototype.emit_to = function(connId, namespace, data) {
  this.members[connId].emit(namespace, data);
};

/**
 * @method
 * return array of ids which are member of the
 * room instance
 *
 */
ActiveSocketRoom.prototype.getMembers = function() {
  var members = [];
  for(var member in this.members) {
    members.push(member);
  }
  return members;
};

/**
 * @constructor
 *
 * assumes the following structure as data.
 *
 * {
 *   "namespace": <namespace>,
 *   "data": {}
 * }
 *
 * options:
 *   connection
 */
var ActiveSocketConnection = function(options) {
  this._options = options;
  this._sock = options.sock;
  this._connection = options.connection;
  this._ns = {};
  this.id = this._connection.id;
  this.rooms_joined = {};

  var that = this;
  this._connection.on('data', function(data) {
    var parsedData = JSON.parse(data);
    that.trigger(parsedData.namespace, parsedData.data);
  });

  this._connection.on('close', function() {
    that.trigger('close');
    that.leave_rooms();
  });
};

/**
 * @method
 *
 * namespace {string}
 * data {object}
 */
ActiveSocketConnection.prototype.trigger = function(namespace, data) {
  for (var i in this._ns[namespace]) {
    this._ns[namespace][i](data, namespace);
  }

  for (var i in this._ns['*']) {
    this._ns['*'][i](data, namespace);
  }
};

/**
 * @method
 *
 * namespace {string}
 * cb {fn}
 */
ActiveSocketConnection.prototype.on = function(namespace, cb) {
  if (!this._ns[namespace]) {
    this._ns[namespace] = [cb];
    return cb;
  }
  this._ns[namespace].push(cb);
  return cb;
};

ActiveSocketConnection.prototype.emit = function(namespace, data) {
  this._connection.write(JSON.stringify({namespace: namespace, data: data}));
};

ActiveSocketConnection.prototype.leave_rooms = function() {
  for(var room in this.rooms_joined) {
    this._sock.rooms[room].leave(this.rooms_joined[room]);
  }
};

/**
 * @constructor
 *
 * options:
 */
var ActiveSocket = function(options) {
  this._options = options;
  this.rooms = {
    "global": new ActiveSocketRoom({name: "global"})
  };
  this._sock = require('sockjs').createServer();
};

/**
 * @proxy
 */
ActiveSocket.prototype.installHandlers = function() {
  this._sock.installHandlers.apply(this._sock, arguments);
};

/**
 * @method
 *
 * cb {fn}
 */
ActiveSocket.prototype.connection = function(cb) {
  // Override connection object
  var that = this;
  this._sock.on('connection', function(conn) {
    cb(new ActiveSocketConnection({connection: conn, sock: that}));
  });
};

/**
 * @method
 * 
 * options:
 *  name
 */
ActiveSocket.prototype.createRoom = function(name, options) {
  if(this.rooms[name] == undefined) {
    this.rooms[name] = new ActiveSocketRoom({
      name: name, 
      options: options
    });
  }
  return this.rooms[name];
};

module.exports = exports = {
  ActiveSocket: ActiveSocket,
  createClient: function(options) {
    return new ActiveSocket(options);
  }
};
