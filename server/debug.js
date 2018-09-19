const fusionHelper = require('./fusionhelper');
const DBConn = require('./DBConnection');
let fh = new fusionHelper();

fh.updateDomain();
fh.updateUIDinDomain();

