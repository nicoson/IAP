const schedule = require('node-schedule');
const fusionHelper = require('./fusionhelper');
const atlabHelper = require('./atlabhelper');
const fh = new fusionHelper();
const ah = new atlabHelper();

class scheduleJob {
    constructor(batchsize = 100, domainJobTriggerTime = 23, urlJobTriggerTime = 0, aiJobTriggerTime = 1) {
        this.batchsize  = batchsize;
        this.domainJobTriggerTime   = domainJobTriggerTime;
        this.urlJobTriggerTime      = urlJobTriggerTime;
        this.aiJobTriggerTime       = aiJobTriggerTime;
        this.domainjob  = '';
        this.urljob     = '';
        this.aijob      = '';
    }

    initJobs() {
        this.domainjob = schedule.scheduleJob(`0 0 ${this.domainJobTriggerTime} * * *`, function(){
            console.log('==============>    domainjob start ...!');
            this.testUpdate();
        }.bin(this));
        this.urljob = schedule.scheduleJob(`0 0 ${this.urlJobTriggerTime} * * *`, function(){
            console.log('==============>    urljob start ...!');
            this.testUpdate();
        }.bin(this));
        // this.aiJob = schedule.scheduleJob(`0 0 ${this.aiJobTriggerTime} * * *`, function(){
        //     console.log('==============>    aijob start ...!');
        //     this.testUpdate();
        // }.bin(this));
    }

    destoryJobs() {

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