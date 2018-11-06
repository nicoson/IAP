//connection to database
const mongo = require('mongodb').MongoClient;
const URL = require('url');

// const HOST = '127.0.0.1';
// const CONNECTION = "mongodb://192.168.33.99:47017/iap";
// Product Env (Qiniu iap-mongo 华东二区)
// const CONNECTION = "mongodb://180.97.147.185:27017";
// Dev Env （xs group）
const CONNECTION = "mongodb://115.238.138.240:47017";
const DATABASE = 'iap'

function DBConn(){};

/* 
    table:   需要创建的表名
    key:     索引字段 unique
*/
DBConn.createTable = function(table, key) {
    return new Promise(function(resolve, reject){
        mongo.connect(CONNECTION, function(err, db) {
            if (err) throw err;
            console.log('|** DBConn.createTable **| db connect success ...');
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

// insert data if not exist
DBConn.insertData = function(table, data) {
    console.log('|** DBConn.insertData **| total day num: ', data.length);
    return new Promise(function(resolve, reject){
        if(data.length == 0) reject('no data');

        mongo.connect(CONNECTION, function(err, db) {
            if (err) reject(err);
            console.log('|** DBConn.insertData **| db connect success ...');
            var dbase = db.db(DATABASE);

            dbase.collection(table).insertMany(data, {ordered: false}, function(err, res) {
                if (err) {
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

DBConn.queryData = function(table, conditions = {}, size=100) {
    return new Promise(function(resolve, reject){
        mongo.connect(CONNECTION, function(err, db) {
            if (err) reject(err);
            console.log('|** DBConn.queryData **| db connect success ...');
            var dbase = db.db(DATABASE);

            dbase.collection(table).find(conditions, {limit: size}).toArray(function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
                
                db.close();
                return
            });
        });
    });
}

// update with different conditions
DBConn.updateData = function(table, operations) {
    return new Promise(function(resolve, reject){
        mongo.connect(CONNECTION, function(err, db) {
            if (err) {
                reject(err);
                return;
            }
            console.log('|** DBConn.updateData **| db connect success ...');
            var dbase = db.db(DATABASE);

            dbase.collection(table).bulkWrite(operations, {ordered: false}, function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
                
                db.close();
                return
            });
        });
    });
}

module.exports = DBConn;