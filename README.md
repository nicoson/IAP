
#config code
client/src/js/config.js (after build: public/javascript/config.js)
server/model/DBConnection.js
app.js

#create database
create database iap;

#set database
set global net_buffer_length=1000000; 
set global max_allowed_packet=1000000000;

#set docker hub account
1381102897 avaprd@qiniu.com

#code check
"model/DBConnection.js" should change to PROD env before deploy

#docs
https://cf.qiniu.io/pages/viewpage.action?pageId=103531116