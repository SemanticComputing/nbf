(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('TitleController', TitleController);

    /* @ngInject */
    function TitleController($stateParams, $uibModal, _, titleService) {
    	
        var vm = this;
        
        vm.openPage = openPage;
        
        init();
        
        function init() {
        	titleService.getTitle($stateParams.titleId).then(function(titles) {
                vm.title = titles[0];
                return vm.title;
            }).catch(handleError);
        }
        
        function openPage() {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return vm.title; }
                }
            });
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
