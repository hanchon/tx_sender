var request = require('request');
var bitcore = require('bitcore-lib-cash');

module.exports = class Explorer {
    constructor(api_addr) {
        this.api_addr = api_addr;
    }

    GenericPostRequest(method, params) {
        var options = {
            url: this.api_addr + method,
            method: "POST",
            timeout: 30000,
            followRedirect: true,
            maxRedirects: 10,
            json: params
        };
        return new Promise(function (resolve, reject) {
            request.post(options, function (err, resp, body) {
                if (!err && resp.statusCode == 200) {
                    resolve(body);
                } else {
                    if (err) {
                        return reject(new Error('Post request network error. ' + err));
                    } else {
                        return reject(new Error('Post logic error. ' + body));
                    }

                }
            });
        });
    }

    async SendTransaction(raw_tx) {
        let info = await this.GenericPostRequest("tx/send", {
            rawtx: raw_tx
        })
        return info;
    }

    GenericGetRequest(method) {
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
        return this.GenericGetRequest("addr/" + wallet + "/utxo");
    }

    async GetUtxos(wallet) {
        let info = await this.GetUtxosFromWallet(wallet);
        return info;
    }

}