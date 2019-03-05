module.exports = {
    // Product Env (Qiniu iap-mongo 华东二区)
    MONGODB:        "mongodb://180.97.147.185:27017",
    // MONGODB:        "mongodb://localhost:27017",
    DATABASE:       "iap",

    //  kodo acss api
    ACSSHOST: 'http://10.34.35.36:8082',
    RSFHOST: 'http://uc.qbox.me',

    //  fusion api
    DEFTONEHOST: 'http://deftonestraffic.fusion.internal.qiniu.io',  // get active domain for specified day
    FUSIONHOST: 'http://analyze.deftone.internal.qiniu.io',          // get top 100 for domain
    FUSIONDOMAIN: 'http://fusiondomain.fusion.internal.qiniu.io',   // get uid by domain

    //  atlab inference api
    CENSORIMGAPI:   'http://ai.qiniuapi.com/v3/image/censor',
    CENSORVIDEOAPI: 'http://ai.qiniuapi.com/v3/video/censor',
    CENSORVIDEOJOBAPI: 'http://ai.qiniuapi.com/v3/jobs/video',

    //  others
    UPLOAD_PATH:    "./public/files",
    FILESERVER:     "http://100.100.62.149:3000/files/",
    CLASSIFY:       ["bloodiness_human","bomb_fire","bomb_smoke","bomb_vehicle","bomb_self-burning","beheaded_isis","beheaded_decollation","march_banner","march_crowed","fight_police","fight_person","character","masked","army","scene_person","anime_likely_bloodiness","anime_likely_bomb","islamic_dress"],
    DETECTION:      ["knives_true","knives_false","knives_kitchen","guns_true","guns_anime","guns_tools","BK_LOGO_1","BK_LOGO_2","BK_LOGO_3","BK_LOGO_4","BK_LOGO_5","BK_LOGO_6","isis_flag","islamic_flag","tibetan_flag","idcard_positive","idcard_negative","bankcard_positive","bankcard_negative","gongzhang","falungong_logo"]
}