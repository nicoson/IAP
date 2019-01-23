const DBConn = require('./DBConnection');

DBConn.createTable('domain', 'domain').then(e => console.log(e));
DBConn.createTable('url', 'url').then(e => console.log(e));
DBConn.createTable('user', 'username').then(e => console.log(e));

DBConn.insertData('user', [{
        "username" : "admin",
        "psd" : "i7Niu!@#$&*()",
        "auth" : [
            "kodo",
            "fusion",
            "operation",
            "search"
        ],
        "create_date" : new Date().getTime()
    },
    {
        "username" : "op",
        "psd" : "operate",
        "auth" : [
            "operation"
        ],
        "create_date" : new Date().getTime()
    },
    {
        "username" : "wajsk",
        "psd" : "wajsk",
        "auth" : [
            "kodo","fusion","operation","search"
        ],
        "create_date" : new Date().getTime()
}]).then(e => console.log(e));