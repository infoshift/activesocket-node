ActiveSocket
============

A sock.js wrapper

Usage
-----

```
// Setup http server and stuff...

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

as.installHandlers(httpServer, {prefix: '/sockjsendpoint'});
server.listen();
```
