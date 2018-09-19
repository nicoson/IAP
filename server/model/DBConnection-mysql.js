//connection to database
const mysql = require('mysql');
const URL = require('url');

// const HOST = '127.0.0.1';
const HOST = '192.168.33.99';
const USER = 'root';
const PASSWORD = 'waroot';
const DATABASE = 'iap'

function DBConn(){};

DBConn.createURLTable = function() {
    //  config database
    let connection = mysql.createConnection({
        host: HOST,
        user: USER,
        password: PASSWORD,
        database: DATABASE
    });

    let p = new Promise(function(resolve, reject){
        connection.connect();
        //  create url & domain table
        let sql =   `CREATE TABLE IF NOT EXISTS url (
                        id bigint(20) PRIMARY KEY NOT NULL auto_increment,
                        url varchar(500) UNIQUE KEY DEFAULT NULL COMMENT 'image url',
                        domain varchar(300) DEFAULT NULL COMMENT 'domain of the original url',
                        status int(1) DEFAULT 0 COMMENT 'status of handled',
                        type varchar(100) DEFAULT NULL COMMENT 'illegal type',
                        create_date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'insert date',
                        update_date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'update date'
                    ) ENGINE=MyISAM DEFAULT CHARSET=utf8`;

        connection.query(sql, function(err, rows, fields) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                console.log('Table domain created successfully !!!');
                resolve('done');
            }
        });
        
        connection.end();
    });

    return p;
}

DBConn.createDomainTable = function() {
    //  config database
    let connection = mysql.createConnection({
        host: HOST,
        user: USER,
        password: PASSWORD,
        database: DATABASE
    });
    let p = new Promise(function(resolve, reject){
        connection.connect();
        //  create url & domain table
        let sql =   `CREATE TABLE IF NOT EXISTS domain (
                        id bigint(20) PRIMARY KEY NOT NULL auto_increment,
                        domain varchar(300) UNIQUE KEY DEFAULT NULL COMMENT 'domain of the original url',
                        uid varchar(20) DEFAULT NULL COMMENT 'user id',
                        create_date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'insert date',
                        update_date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'update date'
                    ) ENGINE=MyISAM DEFAULT CHARSET=utf8`;

        connection.query(sql, function(err, rows, fields) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                console.log('Table domain created successfully !!!');
                resolve('done');
            }
        });
        
        connection.end();
    });

    return p;
}


DBConn.insertData = function(table, data) {
    //  config database
    let connection = mysql.createConnection({
        host: HOST,
        user: USER,
        password: PASSWORD,
        database: DATABASE
    });

    console.log(data.length);
    return new Promise(function(resolve, reject){
        if(data.length == 0) reject('no data');
        connection.connect();
        sql = `INSERT IGNORE INTO ${table} (domain) VALUES ("${data.join('"),("')}")`;

        //  execute query
        connection.query(sql, function(err, rows, fields) {
            if (err) {
                reject(err);
            }
            console.log('Results: ', rows);
            resolve(rows);
        });
        //  close connection
        connection.end();
    });
}

DBConn.getDataFromDomain = function(table, size=100) {
    let connection = mysql.createConnection({
        host: HOST,
        user: USER,
        password: PASSWORD,
        database: DATABASE
    });

    return new Promise(function(resolve, reject){
        connection.connect();
        let sql = `select id, domain from ${table} where uid is NULL limit ${size}`;

        connection.query(sql, function(err, rows, fields) {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
        //  close connection
        connection.end();
    });
}

DBConn.updateDomain = function(table, data) {
    let connection = mysql.createConnection({
        host: HOST,
        user: USER,
        password: PASSWORD,
        database: DATABASE
    });

    let values = data.map(datum => `(${datum.id},"${datum.uid == null ? '-1' : datum.uid}",CURRENT_TIMESTAMP)`);

    return new Promise(function(resolve, reject){
        connection.connect();
        let sql = `insert into ${table} (id,uid,update_date) values ${values.join(',')}
                    on duplicate key update uid=values(uid), update_date=values(update_date);`;

        connection.query(sql, function(err, rows, fields) {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
        //  close connection
        connection.end();
    });
}


// console.log(DBConn.getData())
module.exports = DBConn;