// const fs        = require('fs');
const express     = require('express');
const acssHelper  = require('../model/acsshelper');
const jobHelper   = require('../model/schedulejob');
const router      = express.Router();

let ahelper = new acssHelper();
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


/*=====================*\
          Helper
\*=====================*/

module.exports = router;
