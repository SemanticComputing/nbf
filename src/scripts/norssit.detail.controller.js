(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('DetailController', DetailController);

    /* @ngInject */
    function DetailController($stateParams, $uibModal, _, norssitService) {

        var vm = this;

        vm.openPage = openPage;

        init();

        function init() {
            norssitService.getPerson($stateParams.personId).then(function(person) {
                vm.person = person;
                return person;
            }).then(function(person) {
                return norssitService.getAchievements(person);
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
