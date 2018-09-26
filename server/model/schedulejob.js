const schedule = require('node-schedule');
const fusionHelper = require('./fusionhelper');
const atlabHelper = require('./atlabhelper');
const fh = new fusionHelper();
const ah = new atlabHelper();

class scheduleJob {
    constructor() {
        this.batchsize = 200;
        var j = schedule.scheduleJob('0 0 1 * * *', function(){
            console.log('job 1 works!');
        });


    }

    updateDomainTable() {
        fh.updateDomain(day = new Date());
        fh.updateUIDinDomain();
    }

    updateURLTable() {
        fh.updateURL();
    }

    updateURLTableByAPI() {
        let endTime = [4,0,0];
        let today = new Date();
        let date = [today.getFullYear(), today.getMonth(), today.getDate()];
        if(new Date().getTime < new Date(...date, ...endTime)) {
            ah.censorBatch(this.batchsize).then(e => {
                this.updateURLTableByAPI();
            });
        }
    }
}

module.exports = scheduleJob;