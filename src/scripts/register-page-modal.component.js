(function() {
    'use strict';

    angular.module('facetApp')

    .component('registerPageModal', {
        templateUrl: 'views/page-modal.html',
        controller: RegisterPageModalController,
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        }
    });

    /* @ngInject */
    function RegisterPageModalController($scope) {
        var vm = this;

        vm.close = close;
        vm.nextPage = nextPage;
        vm.previousPage = previousPage;

        vm.$onInit = function() {
            vm.person = vm.resolve.person;
            vm.pageUrl = vm.resolve.person.pageImageURL;
            vm.pageNo = parseInt(vm.resolve.person.pageNumber);
        };

        function close() {
            return $scope.$close();
        }

        function getPageUrl(url, page, offset) {
            return url.replace('' + page, '' + (page + offset));
        }

        function turnPage(offset) {
            vm.pageUrl = getPageUrl(vm.pageUrl, vm.pageNo, offset);
            vm.pageNo = vm.pageNo + offset;
        }

        function nextPage() {
            return turnPage(1);
        }

        function previousPage() {
            return turnPage(-1);
        }
    }
})();
