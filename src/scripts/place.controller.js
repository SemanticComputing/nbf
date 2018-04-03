(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('PlaceController', PlaceController);

    /* @ngInject */
    function PlaceController($stateParams, $uibModal, _, placeService) {
    	
        var vm = this;
        
        vm.openPage = openPage;
        
        init();
        
        function init() {
        	placeService.getPlace($stateParams.placeId).then(function(places) {
                vm.place = places[0];
                return vm.place;
            }).catch(handleError);
        }
        
        function openPage() {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return vm.place; }
                }
            });
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
