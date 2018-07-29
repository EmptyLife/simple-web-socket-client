
const WebSocket_Prototype = require("./WebSocket_Prototype")

const ws = require("ws")

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

module.exports = WebSocket_Nodejs;