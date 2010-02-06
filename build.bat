rmdir /S /Q .\build
mkdir build
java -jar .\lib\jsbuilder\JSBuilder2.jar --verbose --projectFile .\webviews.jsb2 --homeDir .\build