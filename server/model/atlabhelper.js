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
            // console.log('============> get: ', url);
            if(this.fileType(url) == 'image') {
                fetch(APIHOST, this.options).then(e => e.json()).then(data => {
                    resolve(data);
                }).catch(err => {
                    console.log(`[ERROR] |** atlabhelper.censorCall <${new Date()}> **| CensorCall error msg: ${err}`);
                    resolve(-1);
                });
            } else if(this.fileType(url) == 'video') {
                resolve(-1);
            } else {
                resolve(-1);
            }
        }.bind(this));
    }

    async censorBatch(size=1000, concurrency=50) {
        try {
            return new Promise(function(resolve, reject) {
                DBConn.queryData('url', {status: null}, size).then(async function(data){
                    if(data.length == 0) {
                        resolve({
                            code: 204,
                            msg: 'empty queue'
                        });
                        return;
                    }

                    let index = 0
                    let saveCount = 0;
                    let concurrenctCount = 0;
                    let timestamp = (new Date()).getTime();
                    let resData = [];
                    let startRecord = new Date().getTime()

                    while(true) {
                        if(concurrenctCount < concurrency && index < data.length) {
                            
                            let datum = data[index];
                            index++;
                            concurrenctCount++;

                            this.censorCall(datum.url).then(res => {
                                try {
                                    let result = this.resHandler(res);
                                    datum.status = 1;
                                    datum.illegaltype = result.illegaltype;
                                    datum.isillegal = result.isillegal;
                                    datum.score = result.score;
                                    datum.machineresult = res;
                                    datum.update_date = timestamp;
                                    datum.filetype = this.fileType(datum.url);
                                    resData.push(datum);
                                    concurrenctCount--;
    
                                    // ending condition
                                    if(concurrenctCount == 0 && index == data.length) {
                                        saveCount++;
                                        this.saveData(resData, Math.round(saveCount*concurrency/data.length*100));
                                        resolve({
                                            code: 200,
                                            msg: 'job done'
                                        });
                                        console.log(`[INFO] |** atlabhelper.censorBatch <${new Date()}> **| Current job done, totally cost: ${new Date().getTime() - startRecord}ms.`);
                                        return;
                                    } else if(resData.length > concurrency) {
                                        // save partal results
                                        saveCount++;
                                        this.saveData(resData.splice(0, concurrency), Math.round(saveCount*concurrency/data.length*100));
                                    }
                                }
                                catch(err) {
                                    console.log(`[ERROR] |** atlabhelper.censorBatch <${new Date()}> **| CensorCall result handle error msg: ${err}`);
                                    concurrenctCount--;
                                }
                            }).catch(err => {
                                console.log(`[ERROR] |** atlabhelper.censorBatch <${new Date()}> **| CensorCall error catch msg: ${err}`);
                                concurrenctCount--;
                            });
                        } else if(index >= data.length) {
                            console.log('current loop index: # ', saveCount);
                            // console.log(concurrenctCount,index,saveCount,data.length);
                            console.log(`[INFO] |** atlabhelper.censorBatch <${new Date()}> **| While-loop end ...`);
                            break;
                        } else {
                            console.log('sleeeeeeeeeeeeeeeeeeping ...');
                            await new Promise(function(resolve, reject){
                                setTimeout(function(){resolve(1)}, 200);
                            });
                        }
                    }
                }.bind(this)).catch(err => reject({
                    code: 500,
                    msg: 'job failed',
                    err: err
                }));
            }.bind(this));
        }
        catch(err) {
            console.log(`[ERROR] |** atlabhelper.censorBatch <${new Date()}> **| While-loop error msg: ${err}`);
            return {
                code: 500,
                msg: 'job failed'
            };
        }
    }

    saveData(data, process=0) {
        let operations = data.map(datum => {return {
            updateOne: {
                filter: {url: datum.url},
                update: {$set: {
                    status: datum.status,
                    illegaltype: datum.illegaltype,
                    isillegal: datum.isillegal,
                    score: datum.score,
                    machineresult: datum.machineresult,
                    filetype: datum.filetype,
                    update_date: datum.update_date
                }}
            }
        };});

        DBConn.updateData('url', operations).then(e => {
            console.log(`${process}% data has been updated !`);
        }).catch(err => console.log(`data update failed due to: ${err}`));
    }

    resHandler(data) {
        if(data == -1) {
            console.log('data: no data');
            return {
                isillegal: 0,
                illegaltype: 'unknown file',
                score: -1
            }
        } else if (data.error) {
            console.log('data: image size too small < 32x32');
            return {
                isillegal: 0,
                illegaltype: 'small image file',
                score: -1
            }
        } else if (data.code == 0) {
            if(data.result.label == 0) {
                return {
                    isillegal: 0,
                    illegaltype: 'normal',
                    score: data.result.score
                }
            } else {
                let type = [];
                for(let item of data.result.details) {
                    switch(item.type) {
                        case 'pulp':
                            if(item.label == 0) {
                                type.push('色情');
                            }
                            break;
                        case 'terror':
                            if(item.label == 1) {
                                type.push('暴力');
                            }
                            break;
                        case 'politician':
                            if(item.label == 1) {
                                type.push('敏感人物 - ' + item.more[0].value.name);
                            }
                            break;
                    }
                }
                
                return {
                    isillegal: 1,
                    illegaltype: type,
                    score: data.result.score
                }
            }
        } else {
            return {
                isillegal: 0,
                illegaltype: 'unknown file',
                score: -2
            }
        }
    }

    fileType(url) {
        if(url.search(/\.png|\.jpg|\.jpeg|\.webp|\.bmp|\.gif/i) > -1) {
            return 'image';
        } else if(url.search(/\.rm|\.mp4|\.avi|\.wmv|\.3gp/i) > -1) {
            return 'video';
        } else {
            return 'unknown';
        }
    }
}

module.exports = atlabHelper;
