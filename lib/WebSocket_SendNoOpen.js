
module.exports = (cl) => {
	class Ws extends cl {
		constructor(url, options, ...args) {
			super(url, options, ...args);
			
			options = {...options};
			
			if ( options.send_queue ) {
				this._init();
			}
		}
		
		_init() {
			const send = this.send.bind(this);
			
			let sendArray = [];
			
			this.send = (message) => {
				sendArray.push(message);
			};
			
			this.once("open", () => {
				this.send = send;
				
				for(const message of sendArray) {
					this.send(message);
				}
			});
			
			this.once("close", () => {
				this.send = () => {};
				sendArray = [];
			});			
		}
	}
	
	return Ws;
}