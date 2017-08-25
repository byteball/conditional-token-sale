/*jslint node: true */
"use strict";

let constants = require('byteballcore/constants');

exports.port = null;
//exports.myUrl = 'wss://mydomain.com/bb';
exports.bServeAsHub = false;
exports.bLight = false;

exports.storage = 'sqlite';


exports.hub = 'byteball.org/bb';
exports.deviceName = 'Buy blackbytes';
exports.permanent_pairing_secret = '0000';
exports.control_addresses = [];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.bIgnoreUnpairRequests = true;
exports.bSingleAddress = false;
exports.KEYS_FILENAME = 'keys.json';

//email
exports.useSmtp = false;

//contract
exports.TIMESTAMPER_ADDRESS = 'I2ADHGP4HL6J37NQAD73J7E5SKFIXJOT'; // isTestnet ? 'OPNUXBRSSQQGHKQNEPD2GLWQYEUY5XLD' : 'I2ADHGP4HL6J37NQAD73J7E5SKFIXJOT'
exports.contractTimeout = 1; // hours

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
