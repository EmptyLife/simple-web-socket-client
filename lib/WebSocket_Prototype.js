
const EventEmitter = require("events")

/**
	events
		open, message, error, close
*/

/**
	_socketCreate, _socketClose, _socketSend
*/

const INITIALIZATION = -1;
const OPENING = 0;
const OPENED = 1;
const CLOSING = 2;
const CLOSED = 3;

class WebSocket_Prototype extends EventEmitter {
	constructor() {
		super();

		this.readyState = INITIALIZATION;
		
		setImmediate(() => {
			if ( this.isClosed() ) {
				return;
			}
			
			try {
				this._socketCreate();
				this.readyState = OPENING;
			} catch(error) {
				this._onError(error);
			}
		});
	}

	_onOpen() {
		if ( this.readyState !== OPENING ) {return;}
		
		this.readyState = OPENED;
		this.emit("open");
	}
	_onClose() {
		if ( this.readyState === CLOSED ) {return;}
		
		this.readyState = CLOSED;
		this.emit("close");
	}
	_onError(error) {
		if ( this.readyState === CLOSING ) {return;}
		if ( this.readyState === CLOSED ) {return;}

		switch(this.readyState) {
			case OPENING:
			case OPENED:
				this._socketClose();
				break;
		}

		this.emit("error", error);
		this._onClose();
	}
	_onMessage(message) {
		if ( this.readyState !== OPENED ) {return;}
		
		this.emit("message", message);
	}
	
	isOpened() {
		return this.readyState === OPENED;
	}
	isClosed() {
		return this.readyState === CLOSED || this.readyState === CLOSING;
	}
	
	close() {
		switch(this.readyState) {
			case CLOSING:
				throw new Error("Socket is already waiting for closure");
			case CLOSED:
				throw new Error("Socket is already closed");

			case OPENING:
			case OPENED:
				this._socketClose();
				break;
				
			case INITIALIZATION:
				break;
		}
		
		this._onClose();
	}
	
	send(message) {
		if ( !this.isOpened() ) {throw new Error("Socket is not open");}
		
		this._socketSend(message);
	}
	
	
  get INITIALIZATION () { return INITIALIZATION; }
  get OPENING () { return OPENING; }
  get OPENED () { return OPENED; }
  get CLOSING () { return CLOSING; }
  get CLOSED () { return CLOSED; }
}




module.exports = WebSocket_Prototype;
