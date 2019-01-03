const fetch = require('node-fetch');
const DBConn = require('./DBConnection');
const genToken  = require('./genToken');
const CONFIG = require('./config');
let gt = new genToken();

const APIHOST = CONFIG.CENSORIMGAPI;  // get active domain for specified day


class atlabHelper {
    constructor() {
        this.options = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }
    }

    /* ========================= *\
          handle domain table
    \* ========================= */
    censorCall(url) {
        this.options.body = JSON.stringify({
            "data": {
                "uri": url
            },
            "params": {
                "type": [
                    "pulp",
                    "terror",
                    "politician"
                ],
                "detail": true
            }
        });
        
        let token = gt.genToken(APIHOST, this.options.body);
        this.options.headers.Authorization = token;

        return new Promise(function(resolve, reject){
            if(url.search(/.png|.jpg|.jpeg|.webp|.bmp|.gif/i) < 0) {
                console.log('xxxxxxxxxxxxx> url:', url);
                resolve(-1);
                return;
            }
            console.log('============> get: ', url);
            fetch(APIHOST, this.options).then(e => e.json()).then(data => {
                resolve(data);
            }).catch(err => reject(err));
        }.bind(this));
    }

    censorBatch(size = 100, concurrency = 5) {
        try {
            return new Promise(function(resolve, reject) {
                DBConn.queryData('url', {status: null}, size).then(data => {
                    let p = [];
                    if(data.length == 0) {
                        resolve({
                            code: 204,
                            msg: 'empty queue'
                        });
                        return;
                    }

                    let index = 0
                    let concurrenctCount = 0;
                    let timestamp = (new Date()).getTime();
                    let resData = [];

                    while(concurrenctCount < concurrency && index < data.length) {
                        let datum = data[index];
                        index++;
                        concurrenctCount++;

                        this.censorCall(datum.url).then(res => {
                            let result = this.resHandler(res);
                            datum.status = 1;
                            datum.type = result.type;
                            datum.score = result.score;
                            datum.update_date = timestamp;
                            resData.push(datum);
                            concurrenctCount--;

                            // ending condition
                            if(concurrenctCount == 0 && index == data.length) {
                                this.saveData(resData, index);
                                resolve({
                                    code: 200,
                                    msg: 'job done'
                                });
                                break;
                            } else if(resData.length > concurrency) {
                                // save partal results
                                this.saveData(resData.splice(0, concurrenctCount), index);
                            }
                        }).catch(err => {
                            console.log(err);
                            concurrenctCount--;
                        });
                    }
                }).catch(err => reject({
                    code: 500,
                    msg: 'job failed',
                    err: err
                }));
            }.bind(this));
        }
        catch(err) {
            console.log(err);
            return this.censorBatch(size);
        }
    }

    saveData(data, index=0) {
        let operations = data.map(datum => {return {
            updateOne: {
                filter: {url: datum.url},
                update: {$set: {
                    status: datum.status,
                    type: datum.type,
                    update_date: datum.update_date
                }}
            }
        };});

        console.log(index, data);
        DBConn.updateData('url', operations).then(e => {
            console.log(`${index} data updated !`);
        }).catch(err => console.log(`${index} data update failed due to: ${err}`));
    }

    resHandler(data) {
        if(data == -1) {
            console.log('data: no data');
            return {
                type: 'unknown file',
                score: -1
            }
        } else if (data.error) {
            console.log('data: image size too small < 32x32');
            return {
                type: 'small image file',
                score: -1
            }
        } else if (data.code == 0) {
            // console.log('data: ', data.result.details);
            if(data.result.label == 0) {
                return {
                    type: 'normal',
                    score: data.result.score
                }
            } else {
                let type = [];
                for(let item of data.result.details) {
                    switch(item.type) {
                        case 'pulp':
                            if(item.label == 0 && item.score >= 0.90) {
                                type.push('色情');
                            }
                            break;
                        case 'terror':
                            if(item.label == 1 && item.score >= 0.90) {
                                type.push('暴力 - ' + item.class);
                            }
                            break;
                        case 'politician':
                            if(item.label == 1 && item.score >= 0.7) {
                                type.push('敏感人物 - ' + item.more[0].value.name);
                            }
                            break;
                    }
                }
                
                return {
                    type:  type,
                    score: data.result.score
                }
            }
        }
    }
}

module.exports = atlabHelper;
