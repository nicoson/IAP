const fusionHelper = require('./fusionhelper');
const DBConn = require('./DBConnection');
let fh = new fusionHelper();

const atlabHelper = require('./atlabhelper');
let ah = new atlabHelper();

fh.updateDomain();

fh.updateUIDinDomain();

ah.censorBatch(10).then(e => console.log(e));

