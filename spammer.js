var bitcore = require('bitcore-lib-cash');

var Explorer = require('./explorer.js');
var Wallet = require('./wallet.js');
var Config = require('./config.json');

let insight = new Explorer(Config.insight_url);

// Inic wallets:
let wallets = []
for (let i = 0; i < Config.bot.walletsCount; i++) {
    wallets.push(new Wallet(Config.bot.botBaseSeed + i));
}

let offset = Config.bot.walletsCount + 1;
let dust_wallet = new Wallet(Config.bot.botBaseSeed + offset);

async function SendSmallTransactions(wallet) {
    let res = await insight.GetUtxos(wallet.GetAddres());
    let utxos = insight.ParseUtxos(res, Config.wallet.min_amount_sat_to_operate);

    let i = 0;
    while (i < Config.max_depth) {
        let fee = 300 + Math.floor((Math.random() * 100))
        // Create the transaction
        var tx = new bitcore.Transaction()
            .from(utxos)
            .to(dust_wallet.GetAddres(), 2000)
            .change(wallet.GetAddres())
            .feePerKb(fee)
            .sign(wallet.GetPrivKey());

        // Send the transaction
        let sent = await insight.SendTransaction(tx.serialize());

        if (!sent) {
            // Error sending the txn, probably because max_depth.
            break;
        }

        // Check the founds to keep the process going
        if (tx.outputs[1].satoshis < Config.wallet.min_amount_sat_to_operate) {
            throw 'No utxo / founds to operate';
        }

        // Prepare the next utxo
        utxos = [new bitcore.Transaction.UnspentOutput({
            "txid": tx.hash,
            "vout": 1,
            "address": wallet.GetAddres(),
            "scriptPubKey": tx.outputs[1].script,
            "satoshis": tx.outputs[1].satoshis
        })];

        i = i + 1;
    }
}

async function MainLoop() {
    // Send initial money to wallets
    let bigMoneyWallet = new Wallet(Config.bot.bigMoneySeed);

    console.log("Sending money to wallets from: " + bigMoneyWallet.GetAddres())

    let res = await insight.GetUtxos(bigMoneyWallet.GetAddres());
    let utxos = insight.ParseUtxos(res, Config.wallet.min_amount_sat_to_operate);

    let amount = 0;
    for (let i in utxos) {
        amount = amount + utxos[i].satoshis;
    }

    let moneyToSend = Math.floor((amount - Config.bot.bigFeeInSatoshis) / Config.bot.walletsCount);

    var tx = new bitcore.Transaction().from(utxos);

    for (let i in wallets) {
        tx = tx.to(wallets[i].GetAddres(), moneyToSend)
    }
    tx = tx.change(bigMoneyWallet.GetAddres());
    tx = tx.sign(bigMoneyWallet.GetPrivKey());

    let sent = await insight.SendTransaction(tx.serialize());
}

(async () => {
    try {
        if (process.argv[2] === "inic") {
            await MainLoop();
            endend = Config.bot.walletsCount;
        } else {
            // Spam
            for (let i in wallets) {
                await SendSmallTransactions(wallets[i]);
            }
        }
    } catch (e) {
        console.error(e);
    }
})()