// const request = require('request');
// const qiniu = require("qiniu");
const fetch = require('node-fetch');

// const accessKey = "M-G8vwdVdmKYKk50ZdCcIyizX1ItahHnJN-lWsSG";
// const secretKey = "onBC_RiBMOa6cTvUDmpgpguDNZRz4Q_5oW5bkYlA";

const ACSSHOST = 'http://10.34.35.36:8082';

class acssHelper {
    constructor() {

    }

    getList(startDate, endDate) {
        let url = `${ACSSHOST}/api/reported/all?from=${startDate}&to=${endDate}`;
        return new Promise(function(resolve, reject){
            fetch(url).then(e => e.json()).then(data => {
                resolve(data);
            }).catch(e => {
                reject(e);
            });
        });
    }

    getInfoByUid(uid) {
        let url = `${ACSSHOST}/api/userinfo?uid=${uid}`;
        return new Promise(function(resolve, reject){
            fetch(url).then(e => e.json()).then(data => {
                resolve(data);
            }).catch(e => {
                reject(e);
            });
        });
    }

    getListAll(startDate, endDate) {
        return new Promise(function(resolve, reject){
            this.getList(startDate, endDate).then(datum => {
                let uidmap = {};
                let uids = new Set(datum.map(e => e.owner));
                let p = [];
                for(let uid of uids) {
                    p.push(this.getInfoByUid(uid));
                    console.log(uid);
                }
                Promise.all(p).then(data => {
                    // console.log(data);
                    let user = {};
                    for(let u of data) {
                        user[u.DeveloperInfo.uid] = u;
                    }

                    let list = [];
                    for(let u of datum) {
                        if(user[u.owner].DeveloperInfo.internalCategory == 0) {
                            list.push(u);
                        }
                    }

                    console.log('=======>  total data: ', datum.length);
                    console.log('          filter data: ', list.length);

                    resolve({
                        list: list,
                        user: user
                    });
                }).catch(err => reject(err));
            });
        }.bind(this));
    }
}

module.exports = acssHelper;
