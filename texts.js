/*jslint node: true */
'use strict';
const desktopApp = require('byteballcore/desktop_app.js');
const conf = require('byteballcore/conf');

exports.help = () => {
	return `Here you can buy ${conf.assetToSellName} for ${conf.assetToReceiveName}.\nPlease enter the amount of ${conf.assetToSellName} you'd like to buy`
		+ ((conf.assetToSellMultiple !== 1) ? ` (must be a multiple of ${conf.assetToSellMultiple / conf.assetToSellUnitValue}).` : '.')
		+ '\nExchange rate: ' + conf.exchangeRate + ' ' + conf.assetToReceiveName + '/' + conf.assetToSellName + '.';
};

exports.insertMyAddress = () => {
	return 'To continue, send me your address (click ... and Insert my address).';
};

exports.pleaseUnlock = () => {
	return 'Your payment is confirmed, now you can withdraw your funds from the smart address.';
};

exports.weSentPayment = () => {
	return 'Your payment is confirmed, we sent you your ' + conf.assetToSellName + '.';
};

//errors
exports.errorInitSql = () => {
	return 'please import sale.sql file\n';
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