/*jslint node: true */
'use strict';

const db = require('byteballcore/db');
const device = require('byteballcore/device');
const headlessWallet = require('headless-byteball');
const async = require('async');
const conf = require('byteballcore/conf');
const notifications = require('./notifications.js');

function getMyAddressFromContract(shared_address, cb) {
	db.query("SELECT address FROM shared_address_signing_paths WHERE shared_address = ? AND device_address = ? LIMIT 0,1", [shared_address, device.getMyDeviceAddress()], (rows) => {
		cb(rows[0].address);
	})
}

exports.getMyAddressFromContract = getMyAddressFromContract;

exports.checkAndRefundContractsTimeout = () => {
	db.query(
		"SELECT my_address, shared_address, my_amount, peer_amount FROM data_feeds, contracts \n\
		WHERE unit IN (\n\
			SELECT unit_authors.unit FROM unit_authors JOIN units USING(unit)\n\
			WHERE address = ? \n\
			AND units.is_stable = 1\n\
			ORDER BY unit_authors.rowid DESC LIMIT 0,1\n\
		)\n\
		AND data_feeds.feed_name = 'timestamp'\n\
		AND contracts.checked_timeout_date IS NULL \n\
		AND contracts.timeout < data_feeds.int_value",
		[conf.TIMESTAMPER_ADDRESS],
		rows => {
			if (!rows.length) return;
			let arrAddressesAndAmountToRefund = [];
			let arrFullyFundedAddresses = [];

			async.each(rows, (row, callback) => {
				db.query(
					"SELECT address, amount FROM outputs JOIN units USING(unit) \n\
					WHERE address = ? AND amount = ? AND asset IS NULL AND is_stable = 1 AND sequence = 'good'",
					[row.my_address, row.peer_amount],
					(rows2) => {
						if (rows2.length) {
							arrFullyFundedAddresses.push(row.shared_address);
						} else {
							arrAddressesAndAmountToRefund.push({address: row.shared_address, amount: row.my_amount});
						}
						callback();
					}
				);
			}, () => {
				if (arrFullyFundedAddresses.length)
					db.query("UPDATE contracts SET checked_timeout_date=" + db.getNow() + ", refunded=0 WHERE shared_address IN (?)", [arrFullyFundedAddresses]);

				if (!arrAddressesAndAmountToRefund.length) return;
				async.each(arrAddressesAndAmountToRefund, (addressAndAmount, callback) => {
					getMyAddressFromContract(addressAndAmount.address, myAddress => {
						headlessWallet.sendAssetFromAddress(conf.assetToSell, addressAndAmount.amount, addressAndAmount.address, myAddress, null, (err, unit) => {
							if (err) {
								notifications.notifyAdmin('timeout refund ' + addressAndAmount.address + ' failed', err);
								arrAddressesAndAmountToRefund.splice(arrAddressesAndAmountToRefund.indexOf(addressAndAmount.address), 1);
							} else {
								db.query("UPDATE contracts SET checked_timeout_date=" + db.getNow() + ", refunded = 1, unlock_unit=? WHERE shared_address=?", [unit, addressAndAmount.address]);
							}
							callback();
						});
					});
				});
			});
		}
	);
};

exports.getContractBySharedAddress = (shared_address, cb) => {
	db.query("SELECT * FROM contracts WHERE shared_address=?", [shared_address], (rows) => {
		if (rows.length) {
			cb(rows[0]);
		} else {
			cb(null);
		}
	});
};

exports.getContractsToRetryUnlock = (cb) => {
	db.query("SELECT * FROM contracts WHERE checked_timeout_date IS NOT NULL AND refunded = 0 AND unlocked_date IS NULL", cb)
};

exports.setUnlockedContract = (shared_address, unit) => {
	db.query("UPDATE contracts SET unlocked_date=" + db.getNow() + ", unlock_unit=? WHERE shared_address = ?", [unit, shared_address], () => {});
};
