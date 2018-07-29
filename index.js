
const assert = require("assert")
const EventEmitter = require("events")
const ws = require("ws")

/**
	events
		open
		message
		error
		close
*/

/**
	_socketCreate
	_socketClose
	_socketSend
*/
class WebSocket_Prototype extends EventEmitter {
	constructor() {
		super();

		this.socket = null;
		this.opened = false;
		this.closed = false;
		this.errored = false;
		
		this.forcingClosed = false;
		
		this.socket = null;
		
		setImmediate(() => {
			if ( this.forcingClosed ) {
				return this._onClose();
			}
			
			this._socketCreate();
		});
	}
	
	/**
	state vars
	noopen -> open -> close
	noopen -> close
	noopen -> open -> error -> close
	noopen -> error -> close
	*/
	_onOpen() {
		if ( this.closed ) {return;}
		if ( this.errored ) {return;}
		if ( this.opened ) {return;}
		this.opened = true;
		
		this.emit("open");
	}
	_onClose() {
		if ( this.closed ) {return;}
		this.closed = true;
		
		this.emit("close");
	}
	_onError(error) {
		if ( this.closed ) {return;}
		if ( this.errored ) {return;}
		this.errored = true;
		
		this.emit("error", error);
		
		try {
			this.close();
		} catch(e) {}
	}
	_onMessage(message) {
		if ( this.closed ) {return;}
		if ( this.errored ) {return;}
		if ( !this.opened ) {return;}
		
		this.emit("message", message);
	}
	
	isOpened() {
		return this.opened;
	}
	isClosed() {
		return this.closed;
	}
	
	close() {
		if ( this.closed ) {throw new Error("Socket is already closed");}
		if ( this.forcingClosed ) {throw new Error("Socket is already waiting for closure");}
		this.forcingClosed = true;

		if ( this.socket ) {
			this.socket.close();
		}
	}
	
	send(message) {
		if ( this.closed ) {throw new Error("Socket is closed");}
		if ( !this.opened ) {throw new Error("Socket is not open");}
		
		this._socketSend(message);
	}
}

class WebSocket_Browser extends WebSocket_Prototype {
	constructor(url) {
		super();
		
		this.options = {url};
		
		this.socket = null;
	}
	

	
	_socketCreate() {
		try {
			assert(typeof window.WebSocket === "function", "WebSockets not supported")
			
			const socket = this.socket = new window.WebSocket(this.options.url);

			socket.binaryType = "arraybuffer";
			
			socket.addEventListener("open" , this._onOpen.bind(this), {once: true});
			socket.addEventListener("close", this._onClose.bind(this), {once: true});
			socket.addEventListener("error", (event) => this._onError(new Error(this._errorDescriptionOfCode(event))), {once: true});

			socket.addEventListener("message", (event) => {
				let message = event.data;
				if ( message instanceof ArrayBuffer ) {
					message = new Buffer(message);
				}
				
				this._onMessage(message);
			});
		} catch(e) {
			this._onError(e);
		}
	}
	_socketClose() {
		if ( this.socket ) {
			this.socket.close();
		}
	}
	_socketSend(message) {
		if ( this.socket ) {
			this.socket.send(message);	
		}	
	}

	_errorDescriptionOfCode(event) {
		/// https://stackoverflow.com/questions/18803971/websocket-onerror-how-to-read-error-description
		let reason = "";
		if (event.code == 1000)
			reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
		else if(event.code == 1001)
			reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
		else if(event.code == 1002)
			reason = "An endpoint is terminating the connection due to a protocol error";
		else if(event.code == 1003)
			reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
		else if(event.code == 1004)
			reason = "Reserved. The specific meaning might be defined in the future.";
		else if(event.code == 1005)
			reason = "No status code was actually present.";
		else if(event.code == 1006)
			  reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
		else if(event.code == 1007)
			reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
		else if(event.code == 1008)
			reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
		else if(event.code == 1009)
			  reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
		else if(event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
			reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
		else if(event.code == 1011)
			reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
		else if(event.code == 1015)
			reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
		else
			reason = "Unknown reason";
			
		return reason
	}

}
class WebSocket_Nodejs extends WebSocket_Prototype {
	constructor(url) {
		super();
		
		this.options = {url};
		
		this.socket = null;
	}
	
	_socketCreate() {
		try {
			this.socket = new (require("ws"))(this.options.url);
			
			this.socket.once("open" , this._onOpen.bind(this));
			this.socket.once("close", this._onClose.bind(this));
			this.socket.once("error", this._onError.bind(this));

			this.socket.on("message", this._onMessage.bind(this));
		} catch(e) {
			this._onError(e);
		}
		
	}
	_socketClose() {
		if ( this.socket ) {
			this.socket.close();
		}
	}
	_socketSend(message) {
		if ( this.socket ) {
			this.socket.send(message);	
		}	
	}
}



/// 
const isBrowser = new Function("try {return this===window;}catch(e){ return false;}");

module.exports = isBrowser() ? WebSocket_Browser : WebSocket_Nodejs;

