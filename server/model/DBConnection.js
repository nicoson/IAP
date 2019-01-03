//connection to database
const mongo = require('mongodb').MongoClient;
const CONFIG = require('./config');
// const URL = require('url');

const CONNECTION = CONFIG.MONGODB;
const DATABASE = CONFIG.DATABASE;

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
    console.log('|** DBConn.insertData **| total insert data num: ', data.length);
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