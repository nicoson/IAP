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
        let res = await DBConn.queryData('url', conditions, size, skip, 'create_date', -1).catch(err => {console.log(err); return []});
        return res;
    }

    async getUIDbyDomain(domain) {
        console.log('|** appHelper.getUIDbyDomain **| INFO: get data from <domain> table for uid| ', new Date());
        let res = await DBConn.queryData('domain', {domain:domain}, 1, 0).catch(err => {console.log(err); return []});
        return res;
    }

    async updateURLStatus(data) {
        console.log('|** appHelper.updateURLStatus **| INFO: update status for data in <url> table| ', new Date());
        let operations = data.map(datum => {return {
            updateOne: {
                filter: {url: datum.url},
                update: {$set: {
                    status: datum.status,
                    update_date: new Date().getTime()
                }}
            }
        };});
        console.log(JSON.stringify(operations));
        let res = await DBConn.updateData('url', operations).catch(err => console.log(`data update failed due to: ${err}`));
        return res;
    }

}

module.exports = appHelper;