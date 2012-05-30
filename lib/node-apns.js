var tls = require('tls'),
	fs = require('fs'),
	Buffer = require('buffer').Buffer;
var Connection = function(opts){
	var self = this,
		dev_gateway = 'gateway.sandbox.push.apple.com',
		production_gateway = 'gateway.push.apple.com';

	self.socket = null;

	self.options = {
		cert: 'cert.pem',
		cert_data: null,
		key: 'key.pem',
		key_data: null,
		passphrase: null,
		is_dev: false,
		port: 2195,
	};
	
	if(typeof opts !== 'undefined'){
		for(var i in self.options){
			if(typeof opts[i] !== 'undefined'){
				self.options[i] = opts[i];
			}
		}
	}
	
	if(self.options.is_dev){
		self.options.gateway = dev_gateway;
	} else {
		self.options.gateway = production_gateway;
	}
	
	// parse in the certs
	if(self.options.cert_data === null){
		try {
			self.options.cert_data = fs.readFileSync(self.options.cert);
		} catch(err){
			console.log(err);
		}

	}

	if(self.options.key_data === null){
		try {
			self.options.key_data = fs.readFileSync(self.options.key);
		} catch(err){
			console.log(err);
		}

	}
};

Connection.prototype.connect = function(cb){
	var self = this;
	
	var socket_options = {
		cert: self.options.cert_data,
		key: self.options.key_data
	};
	
	if(self.options.passphrase !== null){
		socket_options.passphrase = self.options.passphrase;
	}
	
	self.socket = tls.connect(self.options.port, self.options.gateway, socket_options, function(){
		console.log('connected');
		cb(null);
	});

	self.socket.on('error', function(){
		console.log('socket error');
		cb(true);
	});

	self.socket.on('data', function(data){
		console.log('got data');
		console.log(data);
	});

	self.socket.on('close', function(data){
		console.log('socket closed');
	});

};

Connection.prototype.close = function(){
	var self = this;

	self.socket.end();
};

Connection.prototype.send = function(notification, callback){
	var self = this;

	if(notification.is_valid()){
		function hextobin(hexstr) {
			buf = new Buffer(hexstr.length / 2);
			for(var i = 0; i < hexstr.length/2 ; i++) {
				buf[i] = (parseInt(hexstr[i * 2], 16) << 4) + (parseInt(hexstr[i * 2 + 1], 16));
			}
	
			return buf;
		}
		
		/*
			Pulled some stuff from here:
				http://bravenewmethod.wordpress.com/2010/12/09/apple-push-notifications-with-node-js/
		*/

		//var pushnd = { aps: { alert:'This is a test', sound: 'default'}};
		var payload = notification.dump();
		var hextoken = notification.device;  // Push token from iPhone app. 32 bytes as hexadecimal string

		//var payload = JSON.stringify(pushnd);
		var payloadlen = Buffer.byteLength(payload, 'utf-8');
		var tokenlen = 32;
		var buffer = new Buffer(1 + 4 + 4 + 2 + tokenlen + 2 + payloadlen);
		var i = 0;
		buffer[i++] = 1; // command
		var msgid = 0xbeefcace; // message identifier, can be left 0
		buffer[i++] = msgid >> 24 & 0xFF;
		buffer[i++] = msgid >> 16 & 0xFF;
		buffer[i++] = msgid >> 8 & 0xFF;
		buffer[i++] = msgid & 0xFF;

		// expiry in epoch seconds (1 hour)
		var seconds = Math.round(new Date().getTime() / 1000) + 1*60*60;
		buffer[i++] = seconds >> 24 & 0xFF;
		buffer[i++] = seconds >> 16 & 0xFF;
		buffer[i++] = seconds >> 8 & 0xFF;
		buffer[i++] = seconds & 0xFF;

		buffer[i++] = tokenlen >> 8 & 0xFF; // token length
		buffer[i++] = tokenlen & 0xFF;
		var token = hextobin(hextoken);
		token.copy(buffer, i, 0, tokenlen)
		i += tokenlen;
		buffer[i++] = payloadlen >> 8 & 0xFF; // payload length
		buffer[i++] = payloadlen & 0xFF;

		var payload = Buffer(payload);
		payload.copy(buffer, i, 0, payloadlen);

		console.log(buffer);
		
		var foo = self.socket.write(buffer, 'binary', function(){
			callback(null);	
		});

	} else {
		callback(true, 'Not a valid notification');
	}

};

var Notification = function(opts){
	var self = this;
	

	var options = {
		badge: null,
		sound: 'default',
		alert: 'message',
		device: null,
		payload: {}
	};
	
	for(var i in options){
		if(opts && opts[i]){
			self[i] = opts[i];
		} else {
			self[i] = options[i];
		}
	}

	console.log(self);
}

Notification.prototype.is_valid = function(){
	var self = this;
	
	if(self.device === null){
		return false;
	}

	return true;
}

Notification.prototype.dump = function(){
	var self = this;

	
	var aps = {
		aps: {},
		//payload: self.payload
	};

	if(typeof self.badge === 'number'){
		aps.aps.badge = self.badge;
	}

	if(typeof self.sound === 'string'){
		aps.aps.sound = self.sound;
	}

	if(typeof self.alert === 'string'){
		aps.aps.alert = self.alert;
	}
	
	//return JSON.stringify(aps);

	return JSON.stringify({
		aps: {
			alert: 'My first push notification!',
			sound: 'default'
		}
	});
};




exports.Connection = Connection;
exports.Notification = Notification;
