var bitcore = require('bitcore-lib-cash');

var Explorer = require('./explorer.js');
var Wallet = require('./wallet.js');
var Config = require('./config.json');

let insight = new Explorer(Config.insight_url);
let main_wallet = new Wallet();
let dust_wallet = new Wallet(false);

function ParseUtxos(raw_data) {
    var utxos = [];
    var amount = 0;
    raw_data.forEach(function (utxo) {
        var utxo_ = new bitcore.Transaction.UnspentOutput({
            "txid": utxo["txid"],
            "vout": utxo["vout"],
            "address": utxo["address"],
            "scriptPubKey": utxo["scriptPubKey"],
            "amount": utxo["amount"]
        })
        utxos.push(utxo_);
        amount = amount + utxo["amount"]
    });
    if (bitcore.Unit.fromBTC(amount).toSatoshis() < Config.wallet.min_amount_sat_to_operate) {
        throw 'No utxo / founds to operate';
    } else {
        return utxos;
    }
}

(async () => {
    try {
        let res = await insight.GetUtxos(main_wallet.GetAddres());
        let utxos = ParseUtxos(res);

        var milliseconds = (new Date).getTime();

        let i = 0;
        while (i < 1000) {
            var tx = new bitcore.Transaction()
                .from(utxos)
                .to(dust_wallet.GetAddres(), 2000)
                .change(main_wallet.GetAddres())
                .feePerKb(300)
                .sign(main_wallet.GetPrivKey());

            console.log(tx.serialize());

            if (tx.outputs[1].satoshis < Config.wallet.min_amount_sat_to_operate) {
                throw 'No utxo / founds to operate';
            }

            utxos = [new bitcore.Transaction.UnspentOutput({
                "txid": tx.hash,
                "vout": 1,
                "address": main_wallet.GetAddres(),
                "scriptPubKey": tx.outputs[1].script,
                "satoshis": tx.outputs[1].satoshis
            })];

            i = i + 1;

        }

        let total_time = (new Date).getTime() - milliseconds;
        console.log("Total time (w/o first request):" + total_time);

    } catch (e) {
        console.log("error. " + e);
    }
})();