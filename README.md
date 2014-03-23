ActiveSocket
============

A sock.js wrapper

Requirements
------------

To use `activesocket-node` install [SockJS](https://github.com/sockjs/sockjs-node) using:

    npm install sockjs

Usage
-----

```javascript
var http = require('http');
var as = require('activesocket').createClient();

as.connection(function(conn) {

  conn.on('myevent', function(data) {
    // Do stuff when custom event is triggered.
  });

  conn.on('close', function() {
    // Do something when this connection is closed.
  });

  // Notifying the socket for some event.
  conn.emit('someevent', {data1: 'somedata', data2: 3});

});

var server = http.createServer();
as.installHandlers(server, {prefix: '/sockjsendpoint'});
server.listen(9000, '0.0.0.0');
```
