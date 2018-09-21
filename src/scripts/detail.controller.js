(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('DetailController', DetailController);

    /* @ngInject */
    function DetailController($location, $stateParams, $uibModal, _, nbfService, $sce) {
    	
        var vm = this;
        
        vm.openPage = openPage;
        
        init();
        
        vm.setTab = function(newTab) {
        	vm.tab = ''+newTab;
        	if (vm.tab!="0") $location.search('tab', newTab);
        };
        
        vm.isSet = function(tabNum){
            return vm.tab === ''+tabNum;
        };
        
        
        function init() {
        	
        	var id = $stateParams.personId,
        		regex = /^p[0-9]+$/;
        	if (regex.test(id)) { id = 'http://ldf.fi/nbf/'+id; }
        	
            nbfService.getPerson(id).then(function(person) {
                vm.person = person;
                vm.person.externalLinks = getExternalLinks(person);
                
            	
                nbfService.getBios(id).then(function(data) {
                	if (data.length) {
                		vm.person.bios = data;
                		
                		var lc = $location.search();
                		if (lc && lc.tab) {
                			vm.setTab(lc.tab);
                		} else vm.setTab(0);
                		
                	}
                });
                
                nbfService.getRelatives(id).then(function(data) {
                	if (data.length) vm.person.relative = data;
                });
                
                nbfService.getAuthoredBios(id).then(function(data) {
                	if (data.length && data[0].people) vm.authoredBios = {people: data[0].people, count: data[0].count};
                });

                nbfService.getSimilar(id).then(function(data) {
                	if (data.length && data[0].people) vm.similar = {people: data[0].people, count: data[0].count};
                });
                
                nbfService.getAuthors(id).then(function(data) {
                	if (data.length && data[0].people) vm.authors = {people: data[0].people, count: data[0].count};
                });
                
                nbfService.getByAuthor(id).then(function(data) {
                	if (data.length && data[0].people) vm.sameAuthor = {people: data[0].people, count: data[0].count};
                });
                
                nbfService.getByReferences(id).then(function(data) {
                	if (data.length && data[0].people) vm.referenced = {people: data[0].people, count: data[0].count};
                });
                
                return person;
            }).catch(handleError);
        }
        
        function getExternalLinks(person) {
        	var p = person,
        		arr = [];
        	
        	// if (p.blf) arr.push({url:p.blf, label:"Biografiskt lexikon för Finland"});
        	
        	/*
        	if (p.eduskunta) arr.push({url:p.eduskunta, label:"Eduskunta"});
        	// Load denied by X-Frame-Options: https://www.eduskunta.fi/FI/kansanedustajat/Sivut/808.aspx does not permit cross-origin framing.
        	
        	if (p.fennica) {
        		arr.push({url:p.fennica[0], label:"Fennica"});
        		if (p.fennica.length>1) arr.push({url:p.fennica[1], label:"Fennica (2)"});
        	}
        	*/
        	// if (p.website) arr.push({url:p.website, label:'Kotisivu'});
        	// if (p.kulsa) arr.push({url:p.kulsa, label:'Kulttuurisampo'});
        	
        	
        	if (p.genicom) arr.push({url:p.genicom, label:'Geni.com, kotisivu', tab:'genikotisivu'});

        	if (p.genitree) arr.push({url:p.genitree, label:'Geni.com, sukupuu', tab:'genisukupuu'});
        	
        	if (p.norssi) arr.push({url:'https://www.norssit.fi/semweb/#!/tiedot/http:~2F~2Fldf.fi~2Fnorssit~2F'+p.norssi, label:"Norssit", tab:'norssit'});
        	
        	if (p.kirjasampo) arr.push({url:p.kirjasampo, label:'Kirjasampo', tab:'kirjasampo'});

        	if (p.warsampo) arr.push({url:'https://www.sotasampo.fi/fi/persons/?uri='+p.warsampo, label:"Sotasampo", tab:'warsampo'});
        	
        	if (p.wikipedia) arr.push({url:p.wikipedia, label:"Wikipedia", tab:'wikipedia'});
        	
        	if (p.yo1853) arr.push({
        		url:'https://ylioppilasmatrikkeli.helsinki.fi/1853-1899/henkilo.php?id='+p.yo1853, 
        		label:"Ylioppilasmatrikkeli 1853–1899", 
        		tab:'yo1853'});
        	
        	arr = arr.map(function(ob) {
        		ob.url = ob.url.replace(/^http[s]*:/,'');
        		return ob;
        	})
        	
        	return arr;
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
