/*jslint node: true */
'use strict';
const offerContract = require('./offerContractReversePayment');
const db = require('ocore/db');

module.exports = (myAddress, contract, cb) => {
	offerContract(myAddress, contract, (err, paymentRequestText, shared_address, timeout) => {
		if (err) return cb(err);
		insertContract(myAddress, shared_address, contract.peerAddress, contract.peerDeviceAddress, contract.myAmount, contract.peerAmount, timeout);
		cb(err, paymentRequestText);
	});
};


function insertContract(my_address, shared_address, peer_address, peer_device_address, my_amount, peer_amount, timeout) {
	db.query("INSERT INTO contracts (my_address, shared_address, peer_address, peer_device_address, my_amount, peer_amount, timeout) \n\
		VALUES(?,?,?,?,?,?,?)",
		[my_address, shared_address, peer_address, peer_device_address, my_amount, peer_amount, timeout])
}