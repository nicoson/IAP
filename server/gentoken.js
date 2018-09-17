const request = require('request');
const qiniu = require("qiniu");

const accessKey = "M-G8vwdVdmKYKk50ZdCcIyizX1ItahHnJN-lWsSG";
const secretKey = "onBC_RiBMOa6cTvUDmpgpguDNZRz4Q_5oW5bkYlA";

class getBucketInfo {
    constructor() {

    }

    genToken(reqURL) {
        let mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        let contentType = 'application/x-www-form-urlencoded';
        let reqBody = '';
        let token = qiniu.util.generateAccessToken(mac, reqURL, reqBody);
        console.log(token);
        return token;
    }

    getBucketInfo(reqURL) {
        let token = this.genToken(reqURL);
        let options = {
            method: 'GET',
            url: reqURL,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // 'Account': 'wangan@qiniu.com',
                'Authorization': token
            }
        };
        // console.log(options.headers.Authorization);
        return new Promise(function(resolve,reject){
            request(options, function (err, res, body) {
                if (err) {
                    console.log(err)
                    reject(err)
                }else {
                    // console.log(body);
                    resolve(JSON.parse(body));
                }
            })
        });
    }
}

// module.exports = getURLInfo;

let gb = new getBucketInfo();
gb.getBucketInfo('http://rsf.qbox.me/list?bucket=custom-demo-wangxinban').then(e => console.log(e));