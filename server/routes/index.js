// const fs        = require('fs');
const express     = require('express');
const acssHelper  = require('../model/acsshelper');
const appHelper  = require('../model/apphelper');
const jobHelper   = require('../model/schedulejob');
const router      = express.Router();

let acsshelper = new acssHelper();
let apphelper = new appHelper();
let sjob    = new jobHelper();
sjob.initJobs();  // start schedule jobs

/* GET login page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'login' });
});

/* GET home page. */
router.get('/home', function(req, res, next) {
  res.render('home', { user: 'user1' });
});

/* GET list page. */
router.get('/list', function(req, res, next) {
  res.render('list', { user: 'user1' });
});

/* GET task page. */
router.get('/task', function(req, res, next) {
  res.render('task', { title: 'login' });
});

/* GET custom page. */
router.get('/custom', function(req, res, next) {
  res.render('custom', { title: 'login' });
});



/* ====================== *\
        restful api 
\* ====================== */
//  User API
router.post('/login', function(req, res, next) {
  apphelper.getUserLogin(req.body.username, req.body.psd).then(data => {
    res.send({
      code: 0,
      user: data
    });
  }).catch(err => res.send(err));
});


//  KODO ACSS api
router.post('/getall', function(req, res, next) {
  acsshelper.getList(req.body.startDate, req.body.endDate).then(data => {
    res.send(data);
  }).catch(err => res.send(err));
});

router.post('/getbyuid', function(req, res, next) {
  acsshelper.getInfoByUid(req.body.userinfo).then(data => {
    res.send(data);
  }).catch(err => res.send(err));
});

router.post('/getalldetail', function(req, res, next) {
  acsshelper.getListAll(req.body.startDate, req.body.endDate).then(data => {
    res.send(data);
  }).catch(err => res.send(err));
});


//  fusion api
router.post('/getfusiondata', function(req, res, next) {
  let conditions = {
		$and: [
			{isillegal: 1},
			{create_date: {$gt: new Date(req.body.startDate).getTime()}},
			{create_date: {$lt: new Date(req.body.endDate).getTime()+86400000}},
      {'machineresult.result.score': {$gte: parseFloat(req.body.score)}},
      {$or: []}
		]
  };
  for(let i in req.body.status) {
    if(req.body.status[i]) {
      conditions['$and'][4]['$or'].push({status: parseInt(i)+1});
    }
  }

  console.log(JSON.stringify(conditions));
  apphelper.getIllegalDataFromUrlTable(conditions, req.body.size, req.body.page*req.body.size).then(data => {
    res.send(data);
  }).catch(err => res.send(err));
});

//  fusion api
router.post('/getfusiondatabydomain', function(req, res, next) {
  let conditions = {
		$and: [
			{isillegal: 1},
			{create_date: {$gt: new Date(req.body.startDate).getTime()}},
			{create_date: {$lt: new Date(req.body.endDate).getTime()+86400000}},
      {'machineresult.result.score': {$gte: parseFloat(req.body.score)}},
      {domain: req.body.domain}
		]
  };

  console.log(JSON.stringify(conditions));
  apphelper.getIllegalDataFromUrlTable(conditions, req.body.size, req.body.page*req.body.size).then(data => {
    res.send(data);
  }).catch(err => res.send(err));
});


router.post('/getbydomain', function(req, res, next) {
  apphelper.getUIDbyDomain(req.body.domain).then(uid => {
    console.log('uid: ', uid);
    acsshelper.getInfoByUid(uid[0].uid).then(data => {
      res.send({
        code: 0,
        uid: uid[0].uid,
        data: data
      });
    }).catch(err => res.send(err));
  }).catch(err => {
    res.send({code: 500, err:err});
  });
});

router.post('/updatefusionstatus', function(req, res, next) {
  apphelper.updateURLStatus([req.body]).then(result  => {
    res.send({
      code: 200,
      res: result
    });
  }).catch(err => {
    res.send({code: 500, err:err});
  });
});

router.post('/updatefusionstatusbydomain', function(req, res, next) {
  apphelper.updateURLStatusByDomain([req.body]).then(result  => {
    res.send({
      code: 200,
      res: result
    });
  }).catch(err => {
    res.send({code: 500, err:err});
  });
});


/*=====================*\
          Helper
\*=====================*/

module.exports = router;
