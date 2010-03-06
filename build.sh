
WV_VERSION=`git describe`
WV_BUILD_VERSION=`git describe --abbrev=0`

WV_BUILD_DIR=./build/webviews-$WV_BUILD_VERSION

rm -rf $WV_BUILD_DIR
mkdir -p $WV_BUILD_DIR

sed s/@VERSION@/$WV_VERSION/ < webviews.jsb2 > webviews.jsb2.tmp
java -jar ./lib/jsbuilder/JSBuilder2.jar --verbose --projectFile ./webviews.jsb2.tmp --homeDir ./build
rm webviews.jsb2.tmp

sed s/@VERSION@/$WV_VERSION/ < $WV_BUILD_DIR/webviews-debug.js > $WV_BUILD_DIR/webviews-debug.js.tmp
mv $WV_BUILD_DIR/webviews-debug.js.tmp $WV_BUILD_DIR/webviews-debug.js

sed s/@VERSION@/$WV_VERSION/ < $WV_BUILD_DIR/webviews.js > $WV_BUILD_DIR/webviews.js.tmp
mv $WV_BUILD_DIR/webviews.js.tmp $WV_BUILD_DIR/webviews.js