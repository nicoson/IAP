# ./node_modules/uglify-js-es6/bin/uglifyjs ./dev/javascript/*.js -c -m -o ./dev/javascript/*.js

cp -r ./dev/ ../server/public/
cp ./dev/index.html ../server/views/index.ejs