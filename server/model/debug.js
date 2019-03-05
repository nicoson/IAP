const atlabHelper = require('./atlabhelper');const ah = new atlabHelper();
const fetch = require('node-fetch');const genToken  = require('./genToken');const CONFIG = require('./config');let gt = new genToken();

ah.videoCensorCall().then(e => {console.log(ah.videoJobList);});

ah.videoJobList.add('5c78e1572a6c050007146be5');
ah.videoResultCheck().then(e => {console.log(e);});