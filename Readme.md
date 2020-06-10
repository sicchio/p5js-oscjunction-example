* Currently only sending OSC messages is implemented (if you need to receive OSC messages let me know)
* p5.oscjunction requires jQuery and socket.io (see index.html on how to load it from a CDN).
* Design of p5.oscjunction is a bit wonky. After all it's just a quick hack :) 

## [Live Example](https://cappelnord.github.io/p5js-oscjunction-example/)
* Connects to Node 1, Junction: WebTest
* Sends /mouse, float: x, float: y when drawing on the canvas
* x and y are normalized values
* See [SuperCollider example.scd](SuperCollider%20example.scd) for a receiver example