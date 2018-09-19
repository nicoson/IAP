//connection to database
const mongo = require('mongodb').MongoClient;
const URL = require('url');

// const HOST = '127.0.0.1';
const CONNECTION = "mongodb://192.168.33.99:47017/iap";
const DATABASE = 'iap'

function DBConn(){};

DBConn.createTable = function(table, key) {
    return new Promise(function(resolve, reject){
        mongo.connect(CONNECTION, function(err, db) {
            if (err) throw err;
            console.log('db connect success ...');
            var dbase = db.db(DATABASE);

            // dbase.listCollections({name: table}, {nameOnly: true}).toArray(e => {
            //     console.log(e);
            // });
            dbase.createCollection(table, function (err, res) {
                if (err) reject(err);
                // console.log(res);
                console.log(`table ${table} created!`);
                let fieldOrSpec = {};
                fieldOrSpec[key] = 1;
                dbase.collection(table).createIndex(fieldOrSpec, {unique: true}, function(err,res) {
                    if (err) reject(err);
                    db.close();
                    resolve('done');
                });
            });
        });
    });
}

DBConn.insertData = function(table, data) {
    console.log(data.length);
    return new Promise(function(resolve, reject){
        if(data.length == 0) reject('no data');

        mongo.connect(CONNECTION, function(err, db) {
            if (err) reject(err);
            console.log('db connect success ...');
            var dbase = db.db(DATABASE);

            dbase.collection(table).insertMany(data, {ordered: false}, function(err, res) {
                if (err) {
                    console.log("err: ", err.result);
                    console.log("detail: ", err.result.result.nInserted);
                    if(err.result.result.ok != 1) {
                        reject(err);
                    } else {
                        resolve(err.result.result.nInserted);
                    }
                } else {
                    resolve(res.insertedCount);
                }
                
                db.close();
                return
            });
        });
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