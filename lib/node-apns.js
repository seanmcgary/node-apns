var tls = require('tls'),
	fs = require('fs');
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
			self.options.cert_data = fs.readFileSync(self.options.cert).toString();
		} catch(err){
			console.log(err);
		}

	}

	if(self.options.key_data === null){
		try {
			self.options.key_data = fs.readFileSync(self.options.key).toString();
		} catch(err){
			console.log(err);
		}

	}
};

Connection.prototype.connect = function(){
	var self = this;
	
	var socket_options = {
		cert: self.options.cert_data,
		key: self.options.key_data
	};
	
	//if(self.options.passphrase !== null){
//		socket_options.passphrase = self.options.passphrase;
//	}
	
	console.log(self.options);
	
	self.socket = tls.connect(self.options.gateway, self.options.port, socket_options, function(){
		console.log('connected');
	});

};

Connection.prototype.close = function(){
	var self = this;
};

Connection.prototype.send_msg = function(message){
	var self = this;
};


var Notification = function(opts){
	var self = this;
	

	var options = {
		badge: null,
		sound: 'ping.aiff',
		alert: 'New message',
		payload: 'Hello World!',
		device: null
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




exports.Connection = Connection;
exports.Notification = Notification;
