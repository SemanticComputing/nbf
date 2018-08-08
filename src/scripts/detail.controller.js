(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('DetailController', DetailController);

    /* @ngInject */
    function DetailController($stateParams, $uibModal, _, nbfService, $sce) {
    	
        var vm = this;
        
        vm.openPage = openPage;
        
        init();
        
        function init() {
            nbfService.getPerson($stateParams.personId).then(function(person) {
                vm.person = person;
                nbfService.getBios(vm.person.id).then(function(data) {
                	if (data.length) {
                		
                		data.forEach(function(bio) {
                            if (bio.description) bio.description = $sce.trustAsHtml(bio.description);
                            if (bio.source_paragraph) bio.source_paragraph = $sce.trustAsHtml(bio.source_paragraph);
                            if (bio.lead_paragraph) bio.lead_paragraph = $sce.trustAsHtml(bio.lead_paragraph);
                        });
                		vm.person.bios = data;
                	}
                });
                
                nbfService.getSimilar(vm.person.id).then(function(data) {
                	if (data.length) vm.person.similar = data;
                });
                
                nbfService.getAuthors(vm.person.id).then(function(data) {
                	if (data.length) vm.person.authors = data;
                });
                
                nbfService.getByAuthor(vm.person.id).then(function(data) {
                	if (data.length) vm.person.sameAuthor = data;
                });
                
                nbfService.getByReferences(vm.person.id).then(function(data) {
                	if (data.length) vm.person.referenced = data;
                });
                
                nbfService.getAuthoredBios(vm.person.id).then(function(data) {
                	if (data.length) vm.person.authoredBios = data;
                });
                
                return person;
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
