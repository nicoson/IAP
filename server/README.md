1. mongodb preparation

    1.1 set mongo account
        >mongo 

        >use admin
        >db.createUser({user:'avaroot',pwd:'qnai123',roles:[{role:"root",db:"admin"}],mechanisms:["SCRAM-SHA-1"]});

        >use iap
        >db.createUser({user:"iaproot",pwd:'iapqnai123',roles:[{role:"readWrite",db:"iap"}],mechanisms:["SCRAM-SHA-1"]})

        >db.auth('iaproot','iapqnai123')

    1.2 use auth way start the docker
        >docker-entrypoint.sh mongod --auth

    1.3 login mongodb by using password
        >mongo mongodb://180.97.147.185:27017/iap -u "iaproot" -p "iapqnai123"
    
    more info please refer to this link: [link](https://docs.mongodb.com/guides/server/auth/)
   
2. >npm install
3. >node db_init.js
4. >npm run dev (dev env)
5. >npm start (prd env)
6. export db table as json
   > mongoexport  -h 180.97.147.185 -p 27017 -u "iaproot" -p "iapqnai123" -d iap -c illegal -o ./iap_illegal_20190410.json
   > mongoexport  -h 180.97.147.185 -p 27017 -u "iaproot" -p "iapqnai123" -d iap -c domain -o ./iap_domain_20190410.json
   > mongoexport  -h 180.97.147.185 -p 27017 -u "iaproot" -p "iapqnai123" -d iap -c url -o ./iap_url_20190410.json
7. import db table from json
   > mongoimport --db iap --collection illegal --file ./iap_illegal_20190410.json
   > mongoimport --db iap --collection domain --file ./iap_domain_20190410.json
   > mongoimport --db iap --collection url --file ./iap_url_20190410.json