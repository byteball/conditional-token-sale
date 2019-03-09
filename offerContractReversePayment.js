/*jslint node: true */
'use strict';
const conf = require('ocore/conf');
const headlessWallet = require('headless-obyte');
const db = require('ocore/db');
const storage = require('ocore/storage');

module.exports = (myAddress, contract, cb) => {
	let device = require('ocore/device.js');

	let defaultContract = {
		timeout: conf.contractTimeout,
		myAsset: conf.assetToSell,
		peerAsset: conf.assetToReceive,
	};

	for (let key in defaultContract) {
		if (contract[key] === undefined) contract[key] = defaultContract[key];
	}

	if (contract.myAsset === null) contract.myAsset = 'base';
	if (contract.peerAsset === null) contract.peerAsset = 'base';


	let timeout = Date.now() + Math.round(contract.timeout * 3600 * 1000);
	let arrSeenCondition = ['seen', {
		what: 'output',
		address: myAddress,
		asset: contract.peerAsset,
		amount: contract.peerAmount
	}];
	storage.readAsset(db, conf.assetToSell, null, (err, objAsset) => {
		let arrConditions = (contract.myAsset === 'base' || objAsset.is_private)
			? ['and', [
				['address', contract.peerAddress],
				arrSeenCondition
			]]
			: ['or', [
				['and', [
					['address', contract.peerAddress],
					arrSeenCondition
				]],
				['and', [
					['address', myAddress],
					['has', {
						what: 'output',
						address: contract.peerAddress,
						asset: contract.myAsset,
						amount: contract.myAmount
					}]
				]]
			]];

		let arrDefinition = ['or', [
			arrConditions,
			['and', [
				['address', myAddress],
				['not', arrSeenCondition],
				['in data feed', [[conf.TIMESTAMPER_ADDRESS], 'timestamp', '>', timeout]]
			]]
		]];

		let assocSignersByPath = (contract.myAsset === 'base' || objAsset.is_private)
			? {
				'r.0.0': {
					address: contract.peerAddress,
					member_signing_path: 'r',
					device_address: contract.peerDeviceAddress
				},
				'r.1.0': {
					address: myAddress,
					member_signing_path: 'r',
					device_address: device.getMyDeviceAddress()
				}
			}
			: {
				'r.0.0.0': {
					address: contract.peerAddress,
					member_signing_path: 'r',
					device_address: contract.peerDeviceAddress
				},
				'r.0.0.1': {
					address: myAddress,
					member_signing_path: 'r',
					device_address: device.getMyDeviceAddress()
				},
				'r.1.0': {
					address: myAddress,
					member_signing_path: 'r',
					device_address: device.getMyDeviceAddress()
				}
			};

		let walletDefinedByAddresses = require('ocore/wallet_defined_by_addresses.js');
		walletDefinedByAddresses.createNewSharedAddress(arrDefinition, assocSignersByPath, {
			ifError: (err) => {
				cb(err);
			},
			ifOk: (shared_address) => {
				headlessWallet.issueChangeAddressAndSendPayment(contract.myAsset, contract.myAmount, shared_address, contract.peerDeviceAddress, (err, unit) => {
					if (err) return cb(err);
					let arrPayments = [{
						address: myAddress,
						amount: contract.peerAmount,
						asset: contract.peerAsset
					}];
					let assocDefinitions = {};
					assocDefinitions[shared_address] = {
						definition: arrDefinition,
						signers: assocSignersByPath
					};
					let objPaymentRequest = {payments: arrPayments, definitions: assocDefinitions};
					let paymentJson = JSON.stringify(objPaymentRequest);
					let paymentJsonBase64 = Buffer(paymentJson).toString('base64');
					let paymentRequestCode = 'payment:' + paymentJsonBase64;
					let paymentRequestText = '[your share of payment to the contract](' + paymentRequestCode + ')';
					cb(null, paymentRequestText, shared_address, timeout);
				});
			}
		});
	});
};