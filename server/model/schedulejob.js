const schedule = require('node-schedule');
const fusionHelper = require('./fusionhelper');
const atlabHelper = require('./atlabhelper');
let fh = new fusionHelper();
const ah = new atlabHelper();

// use UTC time zone
class scheduleJob {
    constructor(batchsize = 100, domainJobTriggerTime = 23-8, urlJobTriggerTime = 24-8, aiJobTriggerTime = 25-8) {
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
            console.log('==============>    domainjob start ...!   <=============');
            this.updateDomainURLTable();
        }.bind(this));
        // this.urljob = schedule.scheduleJob(`0 0 ${this.urlJobTriggerTime} * * *`, function(){
        //     console.log('==============>    urljob start ...!');
        //     this.updateURLTable();
        // }.bind(this));
        // this.aiJob = schedule.scheduleJob(`0 0 ${this.aiJobTriggerTime} * * *`, function(){
        //     console.log('==============>    aijob start ...!');
        //     this.updateURLTableByAPI();
        // }.bind(this));
    }

    destoryJobs() {

    }

    updateDomainURLTable() {
        console.log('|** schecule.initJobs **| INFO: start to update domain', new Date());
        // should initialize fusionHelp each time trigger, as status show be changed
        fh.init();
        fh.updateDomain(new Date());
        this.updateUID();
        this.updateURLTable();
    }

    updateUID() {
        if (fh.status != 1) {
            setTimeout(function(){return this.updateUID();}.bind(this), 600000);
            console.log('|** schecule.updateUID **| INFO: updateDomain not ready, delay 10mins to exec');
        } else {
            console.log("|** schecule.updateUID **| INFO: start to update UID ", new Date());
            fh.updateUIDinDomain();
        }
    }

    updateURLTable() {
        if (fh.status != 1) {
            setTimeout(function(){return this.updateURLTable();}.bind(this), 600000);
            console.log('|** schecule.updateURLTable **| INFO: updateDomain not ready, delay 10mins to exec');
        } else {
            console.log("|** schecule.updateURLTable **| INFO: url job started ", new Date());
            fh.updateURL();
        }
        // console.log("INFO: url job started ", new Date());
        // fh.updateURL();
    }

    updateURLTableByAPI() {
        let endTime = [4,0,0];
        let today = new Date();
        let date = [today.getFullYear(), today.getMonth(), today.getDate()];
        if(today.getTime() < new Date(...date, ...endTime).getTime()) {
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