(function() {

    'use strict';
    
    angular.module('facetApp')
    .filter('castArray', function(_) {
        return function(input) {
            return _.castArray(input);
        };
    }); /*.filter('wordSpace', function(_) {
        return function(txt) {
        	if (RegExp('^[.,:!?]$').test(txt)) return "";
            return " ";
        };
    }); */

})();
