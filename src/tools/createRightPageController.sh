#	E.G. bash createRightPageController.sh ../scripts/groupmap.controller.js ../scripts/groupmap.controller.right.js
echo '// created with script' $0 'as a copy of file' $1 > $2

cat $1 |
sed 's/\(GroupmapController\)/\1Right/g' |
sed 's/\(facetUrlStateHandlerService\)/\12/' |
sed 's/\(vm.right *= *\)false;/\1true;/' >> $2