const schedule = require('node-schedule');
const fusionHelper = require('./fusionhelper');
const fh = new fusionHelper();

class scheduleJob {
    constructor() {
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
}

module.exports = scheduleJob;