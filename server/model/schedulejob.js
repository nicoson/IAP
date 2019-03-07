const schedule = require('node-schedule');
const fusionHelper = require('./fusionhelper');
const atlabHelper = require('./atlabhelper');
let fh = new fusionHelper();
let ah = new atlabHelper();

// use UTC time zone
class scheduleJob {
    constructor(batchsize = 1000, concurrency = 50, domainJobTriggerTime = 22, urlJobTriggerTime = 23, aiJobTriggerTime = 0) {
        this.batchsize      = batchsize;
        this.concurrency    = concurrency;
        this.domainJobTriggerTime   = domainJobTriggerTime;
        this.urlJobTriggerTime      = urlJobTriggerTime;
        this.aiJobTriggerTime       = aiJobTriggerTime;
        this.domainjob      = '';
        this.urljob         = '';
        this.aijob          = '';
        this.updateUIDCount = 0;
        this.updateURLCount = 0;
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
        this.aiJob = schedule.scheduleJob(`0 0 ${this.aiJobTriggerTime} * * *`, function(){
            console.log('==============>    aijob start ...!');
            this.updateURLTableByAPI();
        }.bind(this));

        // video jobs
        ah.videoJobControl();
        ah.videoJobCheckControl();
    }

    destoryJobs() {

    }

    updateDomainURLTable() {
        console.log('|** schecule.initJobs **| INFO: start to update domain', new Date());
        // should initialize fusionHelp each time trigger, as status show be changed
        fh.init();
        fh.updateDomain(new Date());
        this.updateUIDCount = 0;
        this.updateURLCount = 0;
        this.updateUID();
        this.updateURLTable();
    }

    updateUID() {
        if (fh.status != 1 && this.updateUIDCount < 6) {
            this.updateUIDCount++;
            setTimeout(function(){return this.updateUID();}.bind(this), 300000);
            console.log('|** schecule.updateUID **| INFO: updateDomain not ready, delay 5mins to exec');
        } else {
            console.log("|** schecule.updateUID **| INFO: start to update UID ", new Date());
            fh.updateUIDinDomain();
        }
    }

    updateURLTable() {
        if (fh.status != 1 && this.updateURLCount < 3) {
            this.updateURLCount++;
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
        let endTime = [11,0,0]; // stop api call before 5 am, use UTC Time zoom 8
        let today = new Date();
        let date = [today.getFullYear(), today.getMonth(), today.getDate()];
        if(today.getTime() < new Date(...date, ...endTime).getTime()) {
            ah.censorBatch(this.batchsize, this.concurrency).then(e => {
                if(e == 'end') {
                    console.log('INFO: ', today, ' job done!');
                    return
                }
                this.updateURLTableByAPI();
            }).catch(err => {
                console.log('|** schecule.updateURLTableByAPI **| WARNING: err happened, try again later!');
                console.log('|** schecule.updateURLTableByAPI **| ERROR: ', JSON.stringify(err));
                setTimeout(function(){return this.updateURLTableByAPI()}.bind(this), 300000);
            });
        } else {
            console.log('INFO: ', today, ' job stopped as time up!');
            return
        }
    }

    testUpdate() {
        console.log('info: test triggered: ', new Date());
    }

    getDebug() {
        // console.log('schedule debug: ', ah);
        return {
            joblist: Array.from(ah.videoJobList),
            catcherr: ah.errCatchInfo
        }
    }
}

module.exports = scheduleJob;