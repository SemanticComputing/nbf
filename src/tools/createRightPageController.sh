#	E.G. bash createRightPageController.sh ../scripts/groupmap.controller.js ../scripts/groupmap.controller.right.js
echo '// created with script' $0 'as a copy of file' $1 > $2

cat $1 |
sed 's/\(LifemapController\)/\1Right/g' |
sed 's/\(GroupmapController\)/\1Right/g' |
sed 's/\(VisuColumnController\)/\1Right/g' |
sed 's/\(VisuPieController\)/\1Right/g' |
sed 's/\(facetUrlStateHandlerService\)/\12/' |
sed 's/\(vm.right *= *\)false;/\1true;/' >> $2