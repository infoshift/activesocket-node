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
  this._connection = options.connection;
  this._ns = {};

  var that = this;
  this._connection.on('data', function(data) {
    var parsedData = JSON.parse(data);
    that.trigger(parsedData.namespace, parsedData.data);
  });

  this._connection.on('close', function() {
    that.trigger('close');
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
    this._ns[namespace][i](data);
  }

  // XXX: Untested
  for (var i in this._ns['*']) {
    this._ns['*'][i](data);
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

/**
 * @constructor
 *
 * options:
 */
var ActiveSocket = function(options) {
  this._options = options;
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
  this._sock.on('connection', function(conn) {
    cb(new ActiveSocketConnection({connection: conn}));
  });
};

module.exports = exports = {
  ActiveSocket: ActiveSocket,
  createClient: function(options) {
    return new ActiveSocket(options);
  };
};
