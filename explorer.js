var request = require('request');
var bitcore = require('bitcore-lib-cash');

module.exports = class Explorer {
    constructor(api_addr) {
        this.api_addr = api_addr;
    }

    GenericRequest(method, params) {
        var options = {
            url: this.api_addr + method,
            method: "GET",
            timeout: 30000,
            followRedirect: true,
            maxRedirects: 10,
            json: true,
        };
        return new Promise(function (resolve, reject) {
            request.get(options, function (err, resp, body) {
                if (!err && resp.statusCode == 200) {
                    resolve(body);
                } else {
                    return reject(new Error('Request error'));
                }
            });
        });
    }

    GetUtxosFromWallet(wallet) {
        return this.GenericRequest("addr/" + wallet + "/utxo", {});
    }

    async GetUtxos(wallet) {
        let info = await this.GetUtxosFromWallet(wallet);
        return info;
    }

}