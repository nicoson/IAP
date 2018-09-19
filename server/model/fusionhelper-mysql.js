const fetch = require('node-fetch');
const DBConn = require('./DBConnection-mongo');

// const accessKey = "M-G8vwdVdmKYKk50ZdCcIyizX1ItahHnJN-lWsSG";
// const secretKey = "onBC_RiBMOa6cTvUDmpgpguDNZRz4Q_5oW5bkYlA";

const DEFTONEHOST = 'http://deftonestraffic.fusion.internal.qiniu.io';  // get active domain for specified day
const FUSIONHOST = 'http://analyze.deftone.internal.qiniu.io';          // get top 100 for domain
const FUSIONDOMAIN = 'http://fusiondomain.fusion.internal.qiniu.io';   // get uid by domain

let newDomain = 0;
let curCount = 0;

class fusionHelper {
    constructor() {
        DBConn.createURLTable().then(e => console.log(e));
        DBConn.createDomainTable().then(e => console.log(e));
    }

    getActiveDomain(day = new Date()) {
        let url = `${DEFTONEHOST}/v2/domain/online/day?day=${day.getFullYear()}${(day.getMonth()+101).toString().slice(1)}${(day.getDate()+100).toString().slice(1)}`;
        return new Promise(function(resolve, reject){
            fetch(url).then(e => e.text()).then(data => {
                resolve(JSON.parse(data));
            }).catch(e => {
                reject(e);
            });
        });
    }

    //  更新 <domain> 表
    updateDomain(day = new Date()) {
        this.getActiveDomain(day).then(data => {
            newDomain = data.length;
            DBConn.insertData('domain', data.filter(e=>e!='internal server error'&&e.length!=0)).then(e => {
                console.log(newDomain + ' active domains detected in ' + day.toJSON());
            });
        });
    }

    getDomains(size) {
        return new Promise(function(resolve, reject) {
            DBConn.getDataFromDomain('domain', size).then(data => {
                resolve(JSON.parse(JSON.stringify(data)));
            }).catch(err => reject(err));
        });
    }

    getUIDbyDomain(domain) {
        let url = `${FUSIONDOMAIN}/v2/domains/${domain}/uid`;
        return new Promise(function(resolve, reject) {
            fetch(url).then(e => e.json()).then(res => {
                if(res.uid != undefined) {
                    resolve(res.uid);
                } else {
                    resolve(null);
                }
            }).catch(err => reject(err));
        });
    }

    updateUIDinDomainSession(size) {
        return new Promise(function(resolve, reject) {
            this.getDomains(size).then(data => {
                if(data.length == 0) resolve(-1);

                let p = [];
                for(let datum of data) {
                    p.push(this.getUIDbyDomain(datum.domain));
                }
    
                Promise.all(p).then(res => {
                    console.log(res);
                    for(let i=0; i<data.length; i++) {
                        data[i].uid = res[i];
                    }

                    DBConn.updateDomain('domain', data).then(res => {
                        resolve(1)
                    }).catch(err => resolve(1));
                }).catch(err => reject(err));
            });
        }.bind(this));
    }

    //  更新 <domain> 表的 uid 字段
    updateUIDinDomain() {
        let size = 100;
        this.updateUIDinDomainSession(size).then(code => {
            if(code == 1) {
                curCount++;
                console.log((100*curCount*size/newDomain).toFixed(2) + '% updated ...');
                this.updateUIDinDomain();
            } else {
                console.log('update domain done!');
            }
        });
    }

    getTopUrl(domain, startDate, endDate) {
        let url = `${FUSIONHOST}/v1/portal/topcounturl`;
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        postBody = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(
                {
                    "domains": domain,
                    "freq": "1day",
                    "region": "global",
                    "startDate": startDate,
                    "endDate": endDate
                }
            )
        };
        
        fetch(url, postBody).then(e => e.text()).then(data => {

        }).catch(err => console.log(err));
    }

    updateURL() {
        let range = 7;
        let startDate = new Date();
        let endDate = new Date();
        startDate = new Date(startDate.setDate(startDate.getDate() - range));

        startDate = `${startDate.getFullYear()}-${(startDate.getMonth()+101).toString().slice(1)}-${(startDate.getDate()+100).toString().slice(1)}-00-00`;
        endDate = `${endDate.getFullYear()}-${(endDate.getMonth()+101).toString().slice(1)}-${(endDate.getDate()+100).toString().slice(1)}-24-00`;


    }
}

module.exports = fusionHelper;
