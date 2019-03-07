const fetch = require('node-fetch');
const DBConn = require('./DBConnection');
const CONFIG = require('./config');

// const accessKey = "M-G8vwdVdmKYKk50ZdCcIyizX1ItahHnJN-lWsSG";
// const secretKey = "onBC_RiBMOa6cTvUDmpgpguDNZRz4Q_5oW5bkYlA";

const DEFTONEHOST = CONFIG.DEFTONEHOST;     // get active domain for specified day
const FUSIONHOST = CONFIG.FUSIONHOST;       // get top 100 for domain
const FUSIONDOMAIN = CONFIG.FUSIONDOMAIN;   // get uid by domain
const TOPN = 10;                            // count top N urls for each Domain

class fusionHelper {
    constructor() {
        this.init();
    }

    init() {
        this.LEN = 0;
        this.curCount = 0;
        this.DATA = [];
        this.retry = 10000;
        this.status = 0;
    }

    /* ========================= *\
          handle domain table
    \* ========================= */
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
            data = data.filter(e => e!='internal server error' && e.length!=0);
            this.LEN = data.length;
            this.DATA = data;
            let timestamp = (new Date()).getTime();
            data = data.map(datum => {
                return {
                    'domain': datum,
                    'uid': null,
                    'create_date': timestamp,
                    'update_date': timestamp
                }
            });
            DBConn.insertData('domain', data).then(num => {
                this.LEN = num;
                this.status = 1;
                console.log(`${num} active domains was inserted at ${day.toJSON()}   ${new Date()}`);
            }).catch(err => console.log(err));
        });
    }

    getDomains(size) {
        return new Promise(function(resolve, reject) {
            DBConn.queryData('domain', {uid: null}, size).then(data => {
                resolve(data);
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
                if(data.length == 0) {
                    resolve(-1);
                    return;
                }

                let p = [];
                for(let datum of data) {
                    p.push(this.getUIDbyDomain(datum.domain));
                }
    
                Promise.all(p).then(res => {
                    // console.log(res);
                    let timestamp = (new Date()).getTime();
                    for(let i=0; i<data.length; i++) {
                        data[i].uid = res[i] ? res[i] : -1;
                        data[i].update_date = timestamp;
                    }

                    let operations = data.map(datum => {return {
                        updateOne: {
                            filter: {domain: datum.domain},
                            update: {$set: {
                                uid: datum.uid,
                                update_date: datum.update_date
                            }}
                        }
                    };});

                    DBConn.updateData('domain', operations).then(res => {
                        resolve(1)
                    }).catch(err => resolve(1));
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        }.bind(this));
    }

    //  更新 <domain> 表的 uid 字段
    updateUIDinDomain() {
        let size = 200;
        try {
            this.updateUIDinDomainSession(size).then(code => {
                if(code == 1) {
                    this.curCount++;
                    console.log(`${this.curCount*size} new data updated ...`);
                    this.updateUIDinDomain();
                } else {
                    console.log('code: ', code);
                    console.log('update domain done!   ', new Date());
                }
                this.retry = 10000; // reset retry time
                console.log(`INFO: current retry interval is set to ${this.retry} ms`);
            });
        }
        catch(err) {
            console.log(err);
            setTimeout(this.updateUIDinDomain(), this.retry);
            this.retry *= 1.1;
            console.log(`WARNING: current retry interval is set to ${this.retry} ms`);
        }
    }


    /* ========================= *\
            handle url table
    \* ========================= */
    getTopUrl(domains, startDate, endDate) {
        return new Promise(function(resolve, reject) {
            let url = `${FUSIONHOST}/v1/portal/topcounturl`;
            // let url = 'http://10.34.41.41:8998/v1/portal/topcounturl';   // debug portal
            let postBody = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(
                    {
                        "domains": domains,
                        "freq": "1day",
                        "region": "global",
                        "startDate": startDate,
                        "endDate": endDate
                    }
                )
            };
            
            fetch(url, postBody).then(e => e.text()).then(data => {
                resolve(JSON.parse(data));
            }).catch(err => {
                console.log(err);
                reject(err);
            });
        });
    }

    updateURLSession(domains, startDate, endDate) {
        let p = [];
        for(let i in domains) {
            p.push(this.getTopUrl([domains[i]], startDate, endDate));
        }

        return new Promise(function(resolve, reject) {
            let data = [];
            let timestamp = (new Date()).getTime();
            Promise.all(p).then(res => {
                for(let i in res) {
                    for(let j in res[i].data.urls) {
                        if(j < TOPN) {    //  count top N urls for each Domain
                            data.push({
                                url: res[i].data.urls[j],
                                domain: domains[i],
                                count: res[i].data.count[j],
                                status: null,
                                type: null,
                                create_date: timestamp,
                                update_date: timestamp
                            });
                        }
                    }
                }

                DBConn.insertData('url', data).then(res => {
                    resolve('done');
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    updateURL() {
        let size = 500;
        let range = 1;
        let startDate = new Date();
        let endDate = new Date();
        startDate = new Date(startDate.setDate(startDate.getDate() - range));

        startDate = `${startDate.getFullYear()}-${(startDate.getMonth()+101).toString().slice(1)}-${(startDate.getDate()+100).toString().slice(1)}-00-00`;
        endDate = `${endDate.getFullYear()}-${(endDate.getMonth()+101).toString().slice(1)}-${(endDate.getDate()+100).toString().slice(1)}-24-00`;

        try {
            let domains = this.DATA.slice(0,size);
            if(domains.length == 0) {
                console.log('update domain done!   ', new Date());
                return;
            }
            this.updateURLSession(domains, startDate, endDate).then(e => {
                this.DATA.splice(0,size);
                if(this.DATA.length > 0) {
                    console.log(size + ' new data inserted into URL table ...');
                    this.updateURL();
                } else {
                    console.log('update domain done!   ', new Date());
                }
                this.retry = 10000; // reset retry time
            });
        }
        catch(err) {
            console.log(err);
            setTimeout(this.updateURL(), this.retry);
            this.retry *= 10;
        }
    }


    /* ========================= *\
            update url table
    \* ========================= */
}

module.exports = fusionHelper;
