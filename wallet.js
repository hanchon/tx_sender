var bitcore = require('bitcore-lib-cash');
var config = require('./config.json');

module.exports = class Wallet {

    constructor(mainwallet = true) {
        if (config.wallet.network == "testnet") {
            this.network = bitcore.Networks.testnet;
        } else {
            this.network = bitcore.Networks.mainnet;
        }

        let value;
        if (mainwallet) {
            value = Buffer.from(config.wallet.main_seed);
        } else {
            value = Buffer.from(config.wallet.dust_seed);
        }

        const hash = bitcore.crypto.Hash.sha256(value);
        const bn = bitcore.crypto.BN.fromBuffer(hash);

        this.privateKey = new bitcore.PrivateKey(bn, bitcore.Networks.testnet)

        this.address = this.privateKey.toAddress(bitcore.Networks.testnet);
    }

    GetAddres() {
        return this.address.toLegacyAddress();
    }

    GetPrivKey() {
        return this.privateKey;
    }

}