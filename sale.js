/*jslint node: true */
'use strict';
const conf = require('byteballcore/conf');
const db = require('byteballcore/db');
const eventBus = require('byteballcore/event_bus');
const headlessWallet = require('headless-byteball');
const texts = require('./texts');
const offerExchangeContract = require('./offerExchangeContract');
const validationUtils = require('byteballcore/validation_utils');
const notifications = require('./notifications');
const contract = require('./contract');
const wallet = require('byteballcore/wallet');
const storage = require('byteballcore/storage');

let assocWaitingStableSharedAddressByUnits = {};
let assocAmountByDeviceAddress = {};

headlessWallet.setupChatEventHandlers();

function payToPeer(contractRow) {
	let device = require('byteballcore/device');
	storage.readAsset(db, conf.assetToSell, null, (err, objAsset) => {
		if (conf.assetToSell === null || objAsset.is_private) {
			device.sendMessageToDevice(contractRow.peer_device_address, 'text', texts.pleaseUnlock());
			contract.setUnlockedContract(contractRow.shared_address, null);
		} else {
			headlessWallet.sendAssetFromAddress(conf.assetToSell, contractRow.my_amount, contractRow.shared_address, contractRow.peer_address, contractRow.peer_device_address, (err, unit) => {
				if (err) return notifications.notifyAdmin('payToPeer sendAssetFromAddress failed', err);
				contract.setUnlockedContract(contractRow.shared_address, unit);
				device.sendMessageToDevice(contractRow.peer_device_address, 'text', texts.weSentPayment());
			});
		}
	})
}

eventBus.on('mci_became_stable', (mci) => {
	let arrWaitingStableUnits = Object.keys(assocWaitingStableSharedAddressByUnits);
	if (arrWaitingStableUnits.length === 0)
		return;
	db.query("SELECT unit FROM units WHERE main_chain_index = ? AND unit IN(?)", [mci, arrWaitingStableUnits], (rows) => {
		rows.forEach((row) => {
			contract.getContractBySharedAddress(assocWaitingStableSharedAddressByUnits[row.unit], (contractRow) => {
				payToPeer(contractRow);
			});
			delete assocWaitingStableSharedAddressByUnits[row.unit];
		});
	});
});


eventBus.on('new_my_transactions', (arrUnits) => {
	let device = require('byteballcore/device.js');
	db.query(
		"SELECT unit, outputs.amount, peer_amount, outputs.asset AS received_asset, peer_device_address, shared_address \n\
		FROM outputs JOIN contracts ON address=my_address \n\
		WHERE unit IN(?) AND NOT EXISTS (SELECT 1 FROM unit_authors CROSS JOIN my_addresses USING(address) WHERE unit_authors.unit=outputs.unit)",
		[arrUnits],
		function (rows) {
			rows.forEach(row => {
				if (row.received_asset !== conf.assetToReceive)
					return device.sendMessageToDevice(row.peer_device_address, 'text', "Received payment in wrong asset");
				if (row.amount !== row.peer_amount)
					return device.sendMessageToDevice(row.peer_device_address, 'text', "Received wrong amount: expected " + row.peer_amount + ", received " + row.amount);
				assocWaitingStableSharedAddressByUnits[row.unit] = row.shared_address;
				device.sendMessageToDevice(row.peer_device_address, 'text', "Received your payment, waiting for confirmation.");
			});
		}
	);
});


eventBus.on('paired', (from_address) => {
	let device = require('byteballcore/device.js');
	device.sendMessageToDevice(from_address, 'text', texts.help());
});

eventBus.on('text', (from_address, text) => {
	let device = require('byteballcore/device');
	let ucText = text.toUpperCase().trim();

	if (validationUtils.isValidAddress(ucText) && assocAmountByDeviceAddress[from_address]) {
		headlessWallet.issueNextMainAddress((myAddress) => {
			offerExchangeContract(myAddress, {
				peerAddress: ucText,
				peerDeviceAddress: from_address,
				peerAmount: assocAmountByDeviceAddress[from_address] * conf.exchangeRate,
				myAmount: assocAmountByDeviceAddress[from_address],
				timeout: conf.contractTimeout //hours
			}, function (err, paymentRequestText) {
				if (err) {
					notifications.notifyAdmin('offerContract error', "trying to sell " + (assocAmountByDeviceAddress[from_address] / conf.assetToSellUnitValue) + " " + conf.assetToSellName + "\n" +err);
					return device.sendMessageToDevice(from_address, 'text', texts.errorOfferContract());
				}
				let amount_in_user_units = assocAmountByDeviceAddress[from_address] / conf.assetToSellUnitValue;
				delete assocAmountByDeviceAddress[from_address];
				return device.sendMessageToDevice(from_address, 'text', 'This is your contract that holds '+amount_in_user_units+' '+conf.assetToSellName+', please check and pay within 15 minutes: ' + paymentRequestText);
			});
		});
	} else if (/[\d.]+\b/.test(ucText)) {
		let amount = Math.round(parseFloat(ucText.match(/[\d.]+\b/)[0]) * conf.assetToSellUnitValue);
		if(amount > 0) {
			if (amount % conf.assetToSellMultiple === 0) {
				assocAmountByDeviceAddress[from_address] = amount;
				return device.sendMessageToDevice(from_address, 'text',
					"Buying: " + (amount / conf.assetToReceiveUnitValue) + ' ' + conf.assetToSellName + '\n' +
					"You'll pay: " + ((amount * conf.exchangeRate) / conf.assetToReceiveUnitValue) + ' ' + conf.assetToReceiveName + '\n' +
					'To continue, send me your address (click ... and Insert my address).');
			} else {
				return device.sendMessageToDevice(from_address, 'text', 'The number is not a multiple of ' + (conf.assetToSellMultiple/conf.assetToSellUnitValue));
			}
		}else{
			return device.sendMessageToDevice(from_address, 'text', 'Enter a number greater than zero');
		}
	} else {
		return device.sendMessageToDevice(from_address, 'text', texts.help());
	}
});

function sendReport() {
	getBalanceForAsset(conf.assetToSell, (balanceAssetToSell) => {
		getBalanceForAsset(conf.assetToReceive, (balanceAssetToReceive) => {
			db.query(
				"SELECT shared_address, creation_date, peer_amount/1e9 AS receive_amount, my_amount/1e9 AS sell_amount FROM contracts \n\
				WHERE refunded=0 AND creation_date>"+db.addTime('-1 DAYS')+" ORDER BY rowid",
				rows => {
					let arrNewContracts = rows.map(row => row.creation_date + ': ' + row.shared_address + ', ' + row.receive_amount + ' ' + conf.assetToReceiveName + ', ' + row.sell_amount + ' ' + conf.assetToSellName);
					let body = 'Total: ' + balanceAssetToSell.total + ' ' + conf.assetToSellName + ', ' + balanceAssetToReceive.total + ' ' + conf.assetToReceiveName + '\n';
					body += 'Free: ' + balanceAssetToSell.total_free + ' ' + conf.assetToSellName + ', ' + balanceAssetToReceive.total_free + ' ' + conf.assetToReceiveName + '\n';
					body += 'Contracted: ' + balanceAssetToSell.total_shared + ' ' + conf.assetToSellName + ', ' + balanceAssetToReceive.total_shared + ' ' + conf.assetToReceiveName + '\n\n';
					body += 'New contracts:\n' + arrNewContracts.join('\n');
					notifications.notifyAdmin('Sale report', body);
				}
			);
		});
	});
}

function checkAndRetryUnlockContracts() {
	contract.getContractsToRetryUnlock((rows) => {
		rows.forEach((contractRow) => {
			payToPeer(contractRow);
		});
	});
}


eventBus.on('headless_wallet_ready', () => {
	let error = '';
	let arrTableNames = ['contracts'];
	db.query("SELECT name FROM sqlite_master WHERE type='table' AND name IN (?)", [arrTableNames], (rows) => {
		if (rows.length !== arrTableNames.length) error += texts.errorInitSql();

		if (conf.useSmtp && (!conf.smtpUser || !conf.smtpPassword || !conf.smtpHost)) error += texts.errorSmtp();

		if (!conf.admin_email || !conf.from_email) error += texts.errorEmail();

		if (error)
			throw new Error(error);

		storage.readAsset(db, conf.assetToSell, null, (err) => {
			if (err) throw new Error(err)
		});

		setInterval(contract.checkAndRefundContractsTimeout, 3600 * 1000);
		contract.checkAndRefundContractsTimeout();

		checkAndRetryUnlockContracts();
		setInterval(checkAndRetryUnlockContracts, 6 * 3600 * 1000);

		sendReport();
		setInterval(sendReport, 24 * 3600 * 1000);
	});
});

function getBalanceForAsset(asset, cb) {
	let asset_condition = (asset && asset !== "base") ? "asset=" + db.escape(asset) : "asset IS NULL";
	db.query("SELECT SUM(amount) AS total_free FROM my_addresses CROSS JOIN outputs USING(address) WHERE is_spent=0 AND " + asset_condition, rows => {
		db.query(
			"SELECT SUM(amount) AS total_shared FROM shared_addresses CROSS JOIN outputs ON shared_address=outputs.address \n\
			WHERE is_spent=0 AND " + asset_condition,
			rows2 => {
				let total_free = rows[0].total_free / 1e9;
				let total_shared = rows2[0].total_shared / 1e9;
				let total = total_free + total_shared;
				cb({
					total_free: total_free,
					total_shared: total_shared,
					total: total
				});
			})
	});
}