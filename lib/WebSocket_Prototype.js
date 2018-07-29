
const EventEmitter = require("events")

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

module.exports = WebSocket_Prototype;
