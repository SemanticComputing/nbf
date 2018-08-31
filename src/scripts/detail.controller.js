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
        
        vm.tab = 0;
        vm.setTab = function(newTab) {
        	vm.tab = newTab;
        };
        
        vm.isSet = function(tabNum){
            return vm.tab === tabNum;
        };
        
        
        function init() {
            nbfService.getPerson($stateParams.personId).then(function(person) {
                vm.person = person;
                vm.person.externalLinks = getExternalLinks(person);
                // vm.person.externalLinks = [] ; // NOTE TEMP DISABLED
                
                nbfService.getBios(vm.person.id).then(function(data) {
                	if (data.length) vm.person.bios = data;
                });
                
                nbfService.getRelatives(vm.person.id).then(function(data) {
                	if (data.length) vm.person.relative = data;
                });
                
                nbfService.getAuthoredBios(vm.person.id).then(function(data) {
                	if (data.length) vm.person.authoredBios = data;
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
                
                return person;
            }).catch(handleError);
        }
        
        function getExternalLinks(person) {
        	var p = person,
        		arr = [];
        	
        	if (p.blf) arr.push({url:p.blf, label:"Biografiskt lexikon för Finland"});
        	if (p.eduskunta) arr.push({url:p.eduskunta, label:"Eduskunta"});
        	if (p.fennica) {
        		arr.push({url:p.fennica[0], label:"Fennica"});
        		if (p.fennica.length>1) arr.push({url:p.fennica[1], label:"Fennica (2)"});
        	}
        	if (p.norssi) arr.push({url:'http://www.norssit.fi/semweb/#!/tiedot/http:~2F~2Fldf.fi~2Fnorssit~2F'+p.norssi, label:"Norssit"});
        	if (p.wikipedia) arr.push({url:p.wikipedia, label:"Wikipedia"});
        	
        	return [];
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
