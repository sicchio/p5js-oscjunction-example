OSCjunction = (function() {

	let protocolVersion = 2;

	let masterData;

	let getMaster = async function() {
		if(masterData !== undefined) {
			return masterData;
		}

		masterData = await $.ajax("https://osc-junction.borgeat.de/master/master.json", {
			type: 'GET',
			dataType: 'json',
		});

		return masterData;
	}

	let connectNode = async function(url, path, success, fail) {
		let socket = io(url, {path: path + "socket.io"});
		let junctions;
		let junctionObjects = {};
		let sessionID;


		let node = {
			connected: false,
		}

		socket.on('status', function(msg) {
			if(msg.protocolVersion != protocolVersion) {
				fail("Protocol mismatch! Terminating connection.");
				socket.close();
			}
			console.log(msg.status);
		    socket.emit("requestSessionID", {});
		});

		socket.on("sessionID", function(msg) {
			sessionID = msg.sessionID;
		});

		let firstUpdate = true;
		socket.on('junctionsUpdate', function(msg) {
			junctions = msg;
			node.connected = true;
			if(firstUpdate) {
				success(node);
			}
			firstUpdate = false;
		});

		socket.on("successOpen", function(msg) {
        	let junctionObject = junctionObjects[msg.id];
        	junctionObject.hashPIN = msg.hashPIN;
        	junctionObject.connected = true;
        	if(junctionObject.success !== undefined) {
        		junctionObject.success(junctionObject);
        	}
        });

        socket.on("failOpen", function(msg) {
         	let junctionObject = junctionObjects[msg.id];
         	junctionObject.connected = false;
         	fail(msg.msg);       	
        });

        let rtt = undefined;
        socket.on("oscjPong", function(msg) {
        	rtt = (new Date()).getTime() - msg.time;
        });

        window.setInterval(function() {
        	socket.emit('oscjPing', {time: new Date().getTime(), rtt: rtt});
        }, 2000);

        window.addEventListener('beforeunload', function() {
        	socket.emit("bye", {});
        });

		node.connectJunctionSend = function(name, pin, success) {
			let junctionID;
			$.each(junctions, function(index, item) {
				if(item.name == name) {
					junctionID = item.id;
				}
			});

			if(junctionID === undefined) {
				fail("OSCjunction: Could not find junction with name: " + name);
				return;
			}

			let junctionObject = {
				id: junctionID,
				connected: false,
				success: success
			};

			junctionObjects[junctionID] = junctionObject;

			junctionObject.send = function(address, arguments) {
				if(!junctionObject.connected) {
					fail("Junction not connected!");
				}

				args = [];
				$.each(arguments, function(index, item) {
					if (typeof item == "string") {
						args.push({type: "s", value: item});
					} else if(typeof item == "number") {
						args.push({type: "f", value: item});
					} else {
						console.log("Could not pack: " + item + " into an OSC message. Put in 'error' instead.");
						args.push({type: "s", value: "error"});
					}
				});

				let oscMessage = {
					address: address,
					args: args
				};

				socket.emit("osc", {id: junctionObject.id, doNotEcho: true, hashPIN: junctionObject.hashPIN, payload: oscMessage});

			}

			if(pin === undefined) {
				pin = "";
			}

			socket.emit("attemptOpen", {type: "send", id: junctionID, pin: pin});

			return junctionObject;
		}

		return node;
	}

	let connectFunction = async function(nodeID, success, fail) {
		let master = await getMaster();

		if(master === undefined) {
			fail("OSCjunction: Could not retreive data from master server.");
			return;
		}
		
		let server;
		$.each(master.servers, function(index, item) {
			if(item.id == nodeID) {
				server = item;
			}
		});

		if(server === undefined) {
			fail("OSCjunction: Could not find node: " + nodeID);
		}

		let node = await connectNode(server.url, server.path, success, fail);

		if(node === undefined) {
			fail("OSCjunction: Could not connect to node.");
		}

		return node;
	}

	return {
		connect: connectFunction
	};
})();