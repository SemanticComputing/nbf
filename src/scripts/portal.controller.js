(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('PortalController', PortalController);

    /* @ngInject */
    function PortalController($stateParams, $uibModal, _, nbfService, $sce) {
    	
        var vm = this;
        
        init();
        
        function init() {
            nbfService.getPortal().then(function(test) {
                return test;
            }).catch(handleError);
        }
        
        function openPage() {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return vm.person; }
                }
            });
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
