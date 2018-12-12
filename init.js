var bitcore = require('bitcore-lib-cash');

var Explorer = require('./explorer.js');
var Wallet = require('./wallet.js');
var Config = require('./config.json');

let insight = new Explorer(Config.insight_url);
let main_wallet = new Wallet(Config.wallet.main_seed);
let dust_wallet = new Wallet(Config.wallet.dust_seed);

(async () => {
    try {
        let res = await insight.GetUtxos(main_wallet.GetAddres());
        let utxos = insight.ParseUtxos(res, Config.wallet.min_amount_sat_to_operate);

        var milliseconds = (new Date).getTime();

        let i = 0;
        while (i < Config.max_depth) {
            // Create the transaction
            var tx = new bitcore.Transaction()
                .from(utxos)
                .to(dust_wallet.GetAddres(), 2000)
                .change(main_wallet.GetAddres())
                .feePerKb(300)
                .sign(main_wallet.GetPrivKey());

            // Send the transaction
            if (Config.send_transactions) {
                let sent = await insight.SendTransaction(tx.serialize());
                if (!sent) {
                    break;
                }
            } else {
                console.log(tx.serialize());
            }

            // Check the founds to keep the process going
            if (tx.outputs[1].satoshis < Config.wallet.min_amount_sat_to_operate) {
                throw 'No utxo / founds to operate';
            }

            // Prepare the next utxo
            utxos = [new bitcore.Transaction.UnspentOutput({
                "txid": tx.hash,
                "vout": 1,
                "address": main_wallet.GetAddres(),
                "scriptPubKey": tx.outputs[1].script,
                "satoshis": tx.outputs[1].satoshis
            })];

            i = i + 1;

        }

        // Some stats:
        let total_time = (new Date).getTime() - milliseconds;
        console.log("Total time (w/o first request):" + total_time);

    } catch (e) {
        console.log("ERROR: " + e);
    }
})();