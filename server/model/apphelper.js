const DBConn    = require('./DBConnection');

// use UTC time zone
class appHelper {
    constructor() {
        this.init();
    }

    init() {

    }

    async getUserLogin(username, psd) {
        console.log('|** appHelper.getUserLogin **| INFO: get data from <user> table for login info| ', new Date());
        let conditions = {$and:[{username:username},{psd:psd}]};
        // console.log(JSON.stringify(conditions));
        let res = await DBConn.queryData('user', conditions, 1, 0).catch(err => {console.log(err); return []});
        return res;
    }

    // get data from <url> table
    async getIllegalDataFromUrlTable(conditions={}, size=50, skip=0) {
        console.log('|** appHelper.getIllegalDataFromUrlTable **| INFO: get data from <url> table for list view| ', new Date());
        let res = await DBConn.queryData('illegal', conditions, size, skip, 'domain', 1).catch(err => {console.log(err); return []});
        let count = await DBConn.count('illegal', conditions).catch(err => {console.log(err); return []});
        console.log('count: ',count);
        return {
            data: res,
            count: count
        };
    }

    async getUIDbyDomain(domain) {
        console.log('|** appHelper.getUIDbyDomain **| INFO: get data from <domain> table for uid| ', new Date());
        let res = await DBConn.queryData('domain', {domain:domain}, 1, 0).catch(err => {console.log(err); return []});
        return res;
    }

    async updateURLStatusByURL(data) {
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
        let res = await DBConn.updateData('illegal', operations).catch(err => console.log(`data update failed due to: ${err}`));
        return res;
    }

    async updateURLStatusByDomain(data) {
        console.log('|** appHelper.updateURLStatusByDomain **| INFO: update status for data in <url> table| ', new Date());
        let operations = data.map(datum => {return {
            updateMany: {
                filter: {$and: [{isillegal: 1},{domain: datum.domain}]},
                update: {$set: {
                    status: datum.status,
                    update_date: new Date().getTime()
                }}
            }
        };});
        console.log(JSON.stringify(operations));
        let res = await DBConn.updateData('illegal', operations).catch(err => console.log(`data update failed due to: ${err}`));
        return res;
    }
}

module.exports = appHelper;