const fusionHelper = require('./fusionhelper');
const DBConn = require('./DBConnection');
const atlabHelper = require('./atlabhelper');
const jobHelper   = require('./schedulejob');

let fh = new fusionHelper();
let ah = new atlabHelper();
let jh = new jobHelper();

fh.updateDomain(new Date()).then(e => e.json()).then(e => console.log(e));

fh.updateUIDinDomain();

// ah.censorBatch(10).then(e => console.log(e));

