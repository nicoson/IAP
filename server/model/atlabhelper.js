const fetch = require('node-fetch');
const DBConn = require('./DBConnection');
const genToken  = require('./genToken');
const CONFIG = require('./config');
let gt = new genToken();

const IMGCONCURRENCY = 50;
const VIDEOCONCURRENCY = 20;

class atlabHelper {
    constructor() {
        this.options = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        };
        this.videoJobList = new Set();
        this.videoJobInfo = {};
        this.errCatchInfo = '';
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
                //  image params
                "scenes": [
                    "pulp",
                    "terror",
                    "politician"
                ]
            }
        });

        return new Promise(function(resolve, reject){
            // console.log('============> get: ', url);
            if(this.fileType(url) == 'image') {
                let token = gt.genToken(CONFIG.CENSORIMGAPI, this.options.body);
                this.options.headers.Authorization = token;
                fetch(CONFIG.CENSORIMGAPI, this.options).then(e => e.json()).then(data => {
                    resolve(data);
                }).catch(err => {
                    console.log(`[ERROR] |** atlabhelper.censorCall image call <${new Date()}> **| CensorCall error msg: ${err}`);
                    resolve(-1);
                });
            } else if(this.fileType(url) == 'video') {
                resolve(-2);
            } else {
                resolve(-1);
            }
        }.bind(this));
    }

    async censorBatch(size=1000, concurrency=50) {
        try {
            return new Promise(function(resolve, reject) {
                DBConn.queryData('url', {status: null}, size, 0, '_id', -1).then(async function(data){
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

    async videoJobControl() {
        let concurrency = VIDEOCONCURRENCY;
        let interval = 500;
        if(this.videoJobList.size >= concurrency) interval = 30000;
        await this.videoCensorCall(concurrency).then(e => {});
        console.log(`[INFO] |** atlabhelper.videoJobControl <${new Date()}> **| current pool size: ${this.videoJobList.size}`);
        setTimeout(function(){this.videoJobControl();}.bind(this), interval);
        return;
    }

    async videoJobCheckControl() {
        let interval = 10000;
        console.log('start to check the results ...');
        if(this.videoJobList.size <= 0) {
            interval = 30000;
        } else {
            for(let jobid of this.videoJobList) {
                await this.videoResultCheck(jobid).then(e => {}).catch(err => console.log('job control check error: ', err));
                await this.sleep(1000);
            }
        }
        
        console.log(`[INFO] |** atlabhelper.videoJobCheckControl <${new Date()}> **| current pool size: ${this.videoJobList.size}`);
        setTimeout(function(){this.videoJobCheckControl();}.bind(this), interval);
    }

    async videoCensorCall(concurrency=100) {
        if(this.videoJobList.size >= concurrency) return;
        try {
            let data = await DBConn.queryData('url', {$and: [{url: /\.rm|\.mp4|\.avi|\.wmv|\.3gp/}, {$or: [{status: null}, {machineresult: -2}]}]}, 1, this.videoJobList.size, '_id', -1);
            if(data.length == 0) {
                console.log(`[INFO] |** atlabhelper.videoCensorCall video call <${new Date()}> **| no more video files in url table!`);
                return;
            }

            let options = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            };
            options.body = JSON.stringify({
                "data": {
                    "uri": data[0].url
                },
                "params": {
                    "scenes": [
                        "pulp",
                        "terror",
                        "politician"
                    ],
                    "cut_param": {
                        "interval_msecs": 5000
                    }
                }
            });
            
            let token = gt.genToken(CONFIG.CENSORVIDEOAPI, options.body);
            options.headers.Authorization = token;
            // console.log('options: ', options);
            let jobid = await fetch(CONFIG.CENSORVIDEOAPI, options).then(e => e.json()).catch(err => {
                console.log(`[ERROR] |** atlabhelper.videoCensorCall video call <${new Date()}> **| videoCensorCall error msg: ${err}`);
            });
            this.videoJobList.add(jobid.job);
            this.videoJobInfo[jobid.job] = data[0];
            // console.log('jobid: ', jobid);
            return;
        }
        catch(err) {
            console.log(`[ERROR] |** atlabhelper.videoCensorCall <${new Date()}> **| function body error msg: ${err}`);
            return;
        }
    }

    async videoResultCheck(jobid = null) {
        try {
            if(this.videoJobList.size == 0 || jobid == null) return 'no jobs';

            let jobinfo = this.videoJobInfo[jobid];
            delete jobinfo['_id'];
            let url = `${CONFIG.CENSORVIDEOJOBAPI}/${jobid}`;
            let options = {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            };
            let token = gt.genToken(url, '', 'GET');
            options.headers.Authorization = token;
            // console.log('options: ', options);
            if(this.videoJobList.size > 0) {
                let res = await fetch(url, options).then(e => e.json()).catch(err => console.log('err: ', err));
                console.log(`[INFO] |** atlabhelper.videoResultCheck <${new Date()}> **| Job status: ${res.status} \n`);
                this.resVideoHandler(res, jobinfo);
                let operations = [{
                    updateOne: {
                        filter: {url: res.request.data.uri},
                        update: {$set: jobinfo},
                        upsert: true
                    }
                }];
                // console.log('operations: ', JSON.stringify(operations));
                if(res.status == 'FINISHED') {
                    if(jobinfo.isillegal == 1) {
                        // console.log(`[INFO] |** atlabhelper.videoResultCheck <${new Date()}> **| save illegal table.`);
                        await DBConn.updateData('illegal', operations).catch(err => {
                            console.log(`[ERROR] |** atlabhelper.videoResultCheck update illegal table error <${new Date()}> **| data update failed due to: ${err}`)
                            console.log('operations: ', operations);
                        });
                    }
                    console.log('[INFO] |** atlabhelper.videoResultCheck <${new Date()}> **| this video looks good ......... ');
                } else if (res.status == 'FAILED') {
                    console.log('audit video failed ......... ');
                } else if (typeof(res.error) != 'undefined') {
                    console.log('video file no longer exists ......... ');
                } else {
                    // not finished, skip to wait
                    return res;
                }
                await DBConn.updateData('url', operations).catch(err => console.log(`[ERROR] |** atlabhelper.videoResultCheck update url table error <${new Date()}> **| data update failed due to: ${err}`));
                this.videoJobList.delete(jobid);
                delete this.videoJobInfo[jobid];
                console.log('job ', jobid, ' done!!!');
                console.log('video job list: ', this.videoJobList.size);
                // console.log('job list: ', this.videoJobList);
                return res;
            }
        }
        catch(err) {
            this.errCatchInfo = err;
            console.log(`[INFO] |** atlabhelper.videoResultCheck <${new Date()}> **| video result check body error: ${err}`);
        }
        return 'no jobs';
    }

    async videoSimpleCheck(jobid = null) {
        if(this.videoJobList.size == 0 && jobid == null) return 'no jobs';

        let url = `${CONFIG.CENSORVIDEOJOBAPI}/${jobid}`;
        let options = {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        };
        let token = gt.genToken(url, '', 'GET');
        options.headers.Authorization = token;
        let res = await fetch(url, options).then(e => e.json()).catch(err => console.log('err: ', err));
        return res;
    }

    saveData(data, process=0) {
        let operations = data.map(datum => {return {
            updateOne: {
                filter: {url: datum.url},
                update: {$set: datum},
                upsert: true
            }
        };});

        let insertion = operations.filter(e => {
            return e.updateOne.update['$set'].isillegal == 1;
        });

        DBConn.updateData('url', operations).then(e => {
            console.log(`${process}% data has been updated !`);
        }).catch(err => console.log(`data update failed due to: ${err}`));

        if(insertion.length > 0) {
            DBConn.updateData('illegal', insertion).then(e => {
                console.log(`${insertion.length} data has been inserted into illegal !`);
            }).catch(err => console.log(`data update failed due to: ${err}`));
        }
    }

    resHandler(data) {
        if(data == -1) {
            console.log('data: no data');
            return {
                isillegal: 0,
                illegaltype: 'unknown file',
                score: -1
            }
        } else if (data == -2) {
            console.log('data: video data');
            return {
                isillegal: null,
                illegaltype: 'video file, leave for video handle',
                score: null
            }
        } else if (data.error) {
            console.log('data: image size too small < 32x32');
            return {
                isillegal: 0,
                illegaltype: 'small image file',
                score: -1
            }
        } else if (data.code == 200) {
            if(data.result.suggestion == 'pass') {
                return {
                    isillegal: 0,
                    illegaltype: 'normal',
                    score: 0
                }
            } else {
                let type = [];
                let scorelist = [];

                if(data.result.scenes.pulp.suggestion != 'pass') {
                    type.push('色情');
                    scorelist.push(data.result.scenes.pulp.details[0].score);
                };
                if(data.result.scenes.terror.suggestion != 'pass') {
                    type.push('暴力');
                    scorelist.push(data.result.scenes.terror.details[0].score);
                };
                if(data.result.scenes.politician.suggestion != 'pass') {
                    type.push('敏感人物');
                    scorelist.push(data.result.scenes.politician.details[0].score);
                };
                
                return {
                    isillegal: 1,
                    illegaltype: type,
                    score: Math.max(...scorelist)
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

    resVideoHandler(data, jobinfo) {
        if(data.status == 'FINISHED') {
            if(data.result.result.suggestion == 'pass') {
                jobinfo.illegaltype = '';
                jobinfo.isillegal = 0;
                jobinfo.score = 0;
                jobinfo.machineresult = data.result;
                jobinfo.status = 1;
            } else {
                let type = [];
                let scorelist = [];
                if(data.result.result.scenes.pulp.suggestion != 'pass') {
                    type.push('色情');
                    scorelist.push(data.result.result.scenes.pulp.cuts.reduce((score, e) => {
                        if(e.suggestion!='pass'){
                            return Math.max(e.details[0].score, score);
                        }else{
                            return score;
                        }
                    }, 0));
                };
                if(data.result.result.scenes.terror.suggestion != 'pass') {
                    type.push('暴力');
                    scorelist.push(data.result.result.scenes.terror.cuts.reduce((score, e) => {
                        if(e.suggestion!='pass'){
                            return Math.max(e.details[0].score, score);
                        }else{
                            return score;
                        }
                    }, 0));
                };
                if(data.result.result.scenes.politician.suggestion != 'pass') {
                    type.push('敏感人物');
                    scorelist.push(data.result.result.scenes.politician.cuts.reduce((score, e) => {
                        if(e.suggestion != 'pass'){
                            return Math.max(e.details[0].score, score);
                        }else{
                            return score;
                        }
                    }, 0));
                };
                jobinfo.illegaltype = type;
                jobinfo.isillegal = 1;
                jobinfo.score = Math.max(...scorelist);
                jobinfo.machineresult = data.result;
                jobinfo.status = 1;
            }
            console.log('inference finished');
        } else if(data.status == 'FAILED') {
            jobinfo.illegaltype = 'audit process failed';
            jobinfo.isillegal = 0;
            jobinfo.score = 0;
            jobinfo.machineresult = -1;
            jobinfo.status = 1;
            console.log('inference failed');
        } else if(typeof(data.error) != 'undefined') {
            jobinfo.illegaltype = data.error;
            jobinfo.isillegal = 0;
            jobinfo.score = 0;
            jobinfo.machineresult = -1;
            jobinfo.status = 1;
            console.log('inference issue');
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

    sleep(period) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve('done');
            }, period);
        });
    }
}

module.exports = atlabHelper;
