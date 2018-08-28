npm install --registry http://registry.npm.baidu-int.com
./node_modules/.bin/webpack
mkdir -p output
curPath=`pwd`
cd ./dist/box/
zip -r box.zip ./*
cd -
mv ./dist/box/box.zip output/