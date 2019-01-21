const DBConn    = require('./DBConnection');

// use UTC time zone
class appHelper {
    constructor() {
        this.init();
    }

    init() {

    }

    // get data from <url> table
    async getIllegalDataFromUrlTable(conditions={}, size=50, skip=0) {
        console.log('|** appHelper.getIllegalDataFromUrlTable **| INFO: get data from <url> table for list view| ', new Date());
        let res = await DBConn.queryData('url', conditions, size, skip).catch(err => {console.log(err); return []});
        return res;
    }

    async getUIDbyDomain(domain) {
        console.log('|** appHelper.getUIDbyDomain **| INFO: get data from <domain> table for uid| ', new Date());
        let res = await DBConn.queryData('domain', {domain:domain}, 1, 0).catch(err => {console.log(err); return []});
        return res;
    }

}

module.exports = appHelper;