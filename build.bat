set VERSION=dev

set WV_BUILD_DIR=build\webviews-%VERSION%

rmdir /S /Q .\build
mkdir %WV_BUILD_DIR%

lib\sed s/@VERSION@/%VERSION%/ < webviews.jsb2 > webviews.jsb2.tmp

java -jar .\lib\jsbuilder\JSBuilder2.jar --verbose --projectFile .\webviews.jsb2.tmp --homeDir .\build

del webviews.jsb2.tmp

lib\sed s/@VERSION@/%VERSION%/ < %WV_BUILD_DIR%\webviews-debug.js > %WV_BUILD_DIR%\webviews-debug.js.tmp
move %WV_BUILD_DIR%\webviews-debug.js.tmp %WV_BUILD_DIR%\webviews-debug.js

lib\sed s/@VERSION@/%VERSION%/ < %WV_BUILD_DIR%\webviews.js > %WV_BUILD_DIR%\webviews.js.tmp
move %WV_BUILD_DIR%\webviews.js.tmp %WV_BUILD_DIR%\webviews.js