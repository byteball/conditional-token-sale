# Conditional token sale bot

This chatbot sells one asset for another via conditional payment smart contracts.  It is unidirectional sale only, the bot doesn't offer the reverse exchange.

By default, it sells blackbytes for bytes but you can customize it to sell your token by editing the conf.

The exchange rate is fixed and set in the conf.

## Install

Install node.js, clone the repository, then say
```sh
npm install
```

## Run
```sh
node sale.js 2>errlog
```

## Control

Since the bot includes a [headless wallet](../../../headless-obyte), you can chat with it, see its balance, and withdraw funds.

## Customize

See the settings [conf.js](conf.js).  The ones you would probably want to change are `exchangeRate`, `assetToSell*`, and `assetToReceive*`.  To override them, add the corresponding keys in your `conf.json` (see [core documentation about conf](../../../ocore#configuring)).

TOR is recommended since you are keeping your private keys online and don't want your IP address to be known. See [core documentation about TOR](../../../ocore#confsockshost-confsocksport-and-confsockslocaldns).
