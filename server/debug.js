const fusionHelper = require('./fusionhelper');
const jobHelper   = require('./schedulejob');

let fh = new fusionHelper();
let jh = new jobHelper();


const DBConn = require('./DBConnection');
const atlabHelper = require('./atlabhelper');
let ah = new atlabHelper();

fh.updateDomain(new Date()).then(e => e.json()).then(e => console.log(e));

fh.updateUIDinDomain();

// ah.censorBatch(10).then(e => console.log(e));

