CREATE TABLE contracts (
	my_address CHAR(32) NOT NULL,
	shared_address CHAR(32) NOT NULL,
	peer_address CHAR(32) NOT NULL,
	peer_device_address CHAR(33) NOT NULL,
	my_amount BIGINT NOT NULL,
    peer_amount BIGINT NOT NULL,
	timeout BIGINT NOT NULL,
	checked_timeout_date TIMESTAMP NULL,
	refunded INT NOT NULL DEFAULT 0,
	unlock_unit CHAR(44),
	unlocked_date TIMESTAMP NULL,
	creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (shared_address),
    FOREIGN KEY (shared_address) REFERENCES shared_addresses(shared_address),
    FOREIGN KEY (unlock_unit) REFERENCES units(unit),
    FOREIGN KEY (my_address) REFERENCES my_addresses(address),
    FOREIGN KEY (peer_device_address) REFERENCES correspondent_devices(device_address)
);

CREATE INDEX byCheckedTimeoutDate ON contracts(checked_timeout_date);