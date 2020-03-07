/*jslint node: true */
"use strict";

let constants = require('ocore/constants');

exports.port = null;
//exports.myUrl = 'wss://mydomain.com/bb';
exports.bServeAsHub = false;
exports.bLight = false;

exports.storage = 'sqlite';


exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';
exports.deviceName = 'Buy blackbytes';
exports.permanent_pairing_secret = '0000';
exports.control_addresses = [];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.bIgnoreUnpairRequests = true;
exports.bSingleAddress = false;
exports.KEYS_FILENAME = 'keys.json';

// email setup
exports.admin_email = '';
exports.from_email = '';

// smtp https://github.com/byteball/ocore/blob/master/mail.js
exports.smtpTransport = 'local'; // use 'local' for Unix Sendmail
exports.smtpRelay = '';
exports.smtpUser = '';
exports.smtpPassword = '';
exports.smtpSsl = null;
exports.smtpPort = null;

//contract
exports.contractTimeout = 1; // hours: how long we are waiting for customer's payment

//bot
exports.assetToSell = constants.BLACKBYTES_ASSET;
exports.assetToSellMultiple = 100000; // in bytes
exports.assetToSellUnitValue = 1000000000; //GB
exports.assetToSellName = 'GBB';

exports.assetToReceive = 'base';
exports.assetToReceiveUnitValue = 1000000000; //GB
exports.assetToReceiveName = 'GB';

exports.exchangeRate = 0.05;


if(exports.assetToSell === 'base') exports.assetToSell = null;
if(exports.assetToReceive === 'base') exports.assetToReceive = null;
if(!exports.assetToSellMultiple || exports.assetToSellMultiple <= 0) exports.assetToSellMultiple = 1;
