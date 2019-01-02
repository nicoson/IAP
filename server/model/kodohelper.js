const fetch = require('node-fetch');
const qiniu = require("qiniu");
const DBConn = require('./DBConnection');

const APIHOST = 'http://uc.qbox.me';  // get active domain for specified day


class kodoHelper {
    constructor() {
        this.options = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        };
        this.accessKey = "ppca4hFBYQ_ykozmLUcSIJi8eLnYhFahE0OF5MoZ";
        this.secretKey = "kc6oDxKD3TYoRq3lUoS41-e4qtNYWzBSQZmigm7K";
    }

    genToken(reqURL) {
        let mac = new qiniu.auth.digest.Mac(this.accessKey, this.secretKey);
        let contentType = 'application/json';
        let reqBody = '';
        // let token = qiniu.util.generateAccessTokenV2(mac, reqURL, 'GET', contentType, reqBody);
        let token = qiniu.util.generateAccessToken(mac, reqURL, reqBody);
        console.log(token);
        return token;
    }

    /* ========================= *\
          xxx
    \* ========================= */
    //  get bucket list for uid
    getBucketList(uid) {
        let api = `${APIHOST}/admin/buckets/uid/${uid}`;
        let token = this.genToken(api, this.options.body);
        this.options.headers.Authorization = token;

        return new Promise(function(resolve, reject){
            fetch(api, this.options).then(e => e.json()).then(data => {
                resolve(data);
            }).catch(err => reject(err));
        }.bind(this));
    }

    //  get all bucket details info for uid
    getBucketsInfo(uid) {
        let api = `${APIHOST}/admin/allbuckets?limit=100&uid=${uid}`;
        let token = this.genToken(api, this.options.body);
        this.options.headers.Authorization = token;

        return new Promise(function(resolve, reject){
            fetch(api, this.options).then(e => e.json()).then(data => {
                resolve(data);
            }).catch(err => reject(err));
        }.bind(this));
    }

    //  get file list from bucket by itbl
    getFileList(region, itbl, marker=null) {
        let api = `${APIHOST}/admin/listbyitbl?region=${region}&itbl=${itbl}&limit=100${marker?('&marker='+marker):''}`;
        let token = this.genToken(api, this.options.body);
        this.options.headers.Authorization = token;

        return new Promise(function(resolve, reject){
            fetch(api, this.options).then(e => {console.log(e);return e.json()}).then(data => {
                resolve(data);
            }).catch(err => reject(err));
        }.bind(this));
    }

}

module.exports = kodoHelper;
