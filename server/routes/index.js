// const fs        = require('fs');
const express     = require('express');
const acssHelper  = require('../model/acsshelper');
const appHelper  = require('../model/apphelper');
const jobHelper   = require('../model/schedulejob');
const router      = express.Router();

let ahelper = new acssHelper();
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
//  KODO ACSS api
router.post('/getall', function(req, res, next) {
  ahelper.getList(req.body.startDate, req.body.endDate).then(data => {
    res.send(data);
  }).catch(err => res.send(err));
});

router.post('/getbyuid', function(req, res, next) {
  ahelper.getInfoByUid(req.body.userinfo).then(data => {
    res.send(data);
  }).catch(err => res.send(err));
});

router.post('/getalldetail', function(req, res, next) {
  ahelper.getListAll(req.body.startDate, req.body.endDate).then(data => {
    res.send(data);
  }).catch(err => res.send(err));
});


//  fusion api
router.post('/getfusiondata', function(req, res, next) {
  let conditions = {
		$and: [
			{isillegal: 1},
			{update_date: {$gt: new Date(req.body.startDate).getTime()}},
			{update_date: {$lt: new Date(req.body.endDate).getTime()+86400000}}
		]
  };
  console.log(JSON.stringify(conditions));
  apphelper.getIllegalDataFromUrlTable(conditions).then(data => {
    res.send(data);
  }).catch(err => res.send(err));
});

router.post('/getbydomain', function(req, res, next) {
  apphelper.getUIDbyDomain(req.body.domain).then(uid => {
    console.log('uid: ', uid);
    ahelper.getInfoByUid(uid[0].uid).then(data => {
      res.send(data);
    }).catch(err => res.send(err));
  }).catch(err => {
    res.send({code: 500, err:err});
  });
});


/*=====================*\
          Helper
\*=====================*/

module.exports = router;
