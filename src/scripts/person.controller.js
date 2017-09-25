(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('PersonController', PersonController);

    /* @ngInject */
    function PersonController($state, $stateParams, $uibModal, _, nbfService) {

        var vm = this;

        vm.selectTab = selectTab;

        selectTab();

        function selectTab(tab) {
        	console.log('terve')
        	if (tab === 2) {
        		$state.go('person.map');
        	} else {
        		$state.go('person.detail');
        	}
        }
    }
})();
