const schedule = require('node-schedule');
const fusionHelper = require('./fusionhelper');
const atlabHelper = require('./atlabhelper');
const fh = new fusionHelper();
const ah = new atlabHelper();

class scheduleJob {
    constructor() {
        this.batchsize = 200;
        var job = schedule.scheduleJob('0 0 1 * * *', function(){
            // console.log('job 1 works!');
            this.testUpdate();
        });
    }

    updateDomainTable() {
        console.log("INFO: Domain job started ", new Date());
        fh.updateDomain(day = new Date());
        fh.updateUIDinDomain();
    }

    updateURLTable() {
        console.log("INFO: url job started ", new Date());
        fh.updateURL();
    }

    updateURLTableByAPI() {
        let endTime = [4,0,0];
        let today = new Date();
        let date = [today.getFullYear(), today.getMonth(), today.getDate()];
        if(today.getTime < new Date(...date, ...endTime).getTime()) {
            ah.censorBatch(this.batchsize).then(e => {
                if(e == 'end') {
                    console.log('INFO: ', today, ' job done!');
                    return
                }
                this.updateURLTableByAPI();
            }).catch(err => {
                console.log('WARNING: err happened, try again later!');
                this.updateURLTableByAPI();
            });
        } else {
            console.log('INFO: ', today, ' job stopped as time up!');
            return
        }
    }

    testUpdate() {
        console.log('info: test triggered: ', new Date());
    }
}

module.exports = scheduleJob;