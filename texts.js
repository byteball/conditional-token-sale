/*jslint node: true */
'use strict';
const desktopApp = require('byteballcore/desktop_app.js');
const conf = require('byteballcore/conf');

exports.help = () => {
	return `I'm a bot of exchanging ${conf.assetToReceiveName} for ${conf.assetToSellName}\nPlease enter the amount of ${conf.assetToSellName}`
		+ ((conf.assetToSellMultiple !== 1) ? ` multiple ${conf.assetToSellMultiple / conf.assetToSellUnitValue}` : '')
		+ '\nExchange rate: ' + conf.exchangeRate;
};

exports.insertMyAddress = () => {
	return 'To continue, send me your address (click ... and Insert my address).';
};

exports.pleaseUnlock = () => {
	return 'Please withdraw your funds from the exchange smart address.';
};

exports.weSentPayment = () => {
	return 'We sent you your ' + conf.assetToSellName + '.';
};

//errors
exports.errorInitSql = () => {
	return 'please import exchange.sql file\n';
};

exports.errorSmtp = () => {
	return `please specify smtpUser, smtpPassword and smtpHost in your ${desktopApp.getAppDataDir()}/conf.json\n`;
};

exports.errorEmail = () => {
	return `please specify admin_email and from_email in your ${desktopApp.getAppDataDir()}/conf.json\n`;
};

exports.errorOfferContract = () => {
	return 'An error occurred while creating the contract, please try again in 10 minutes.';
};