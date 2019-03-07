const qiniu = require("qiniu");

// const accessKey = "yvkBAhylLK6HTrhU644UcFiVeFhRMR4geKGB1Prt";
// const secretKey = "1Kfm9tUJURJWxYFHWL1X-HuVVFMMEPwn2S4j5EoW";

// account: gr@qiniu.com
const accessKey = "ljZn6Iv-DilvkOI1o3ztoz-9sW5bZ2mV-Lpi9EKf";
const secretKey = "m5r3FcGjQWAOvAn6vWKG9Vxq6j1cUsFgbJBuUCbp";

class genToken {
    constructor() {

    }

    genToken(reqURL, reqBody='', method='POST', isMock=false) {
        if(isMock) return 'QiniuStub uid=1&ut=2';

        let mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        // let reqURL = "http://10.34.43.45:16301/admin/domain/oquqvdmso.bkt.clouddn.com";
        let contentType = 'application/json';
        let token = qiniu.util.generateAccessTokenV2(mac, reqURL, method, contentType, reqBody);
        // let token = qiniu.util.generateAccessToken(mac, reqURL, reqBody);
        // console.log(token);
        return token;
    }

}

module.exports = genToken;