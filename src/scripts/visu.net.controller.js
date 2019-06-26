/*
 * Semantic faceted search
 *
 */

(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the results view.
    */
    .controller('VisuNetController', VisuNetController);

    /* @ngInject */
    function VisuNetController($log, $location, $scope, $state, _, google, visuNetService, 
    		FacetHandler, facetUrlStateHandlerService, $uibModal, EVENT_FACET_CHANGED) {

		google.charts.load('current', {'packages':['sankey']});
		
        var vm = this;
        
        vm.people = [];
        vm.data = {};
        
        vm.message = "";
        vm.head1 = "";
        vm.head2 = "";
        
        
        vm.RELATIONOPTIONS = [
        	{value:'parent', label:'Vanhemmat', classes:'(rels:Parent, rels:Father, rels:Mother)'},
        	{value:'father', label:'  Isä', classes:'(rels:Father)'},
        	{value:'mother', label:'  Äiti', classes:'(rels:Mother)'},
        	{value:'child', label:'Lapset', classes:'(rels:Child, rels:Son, rels:Daughter)'},
        	{value:'spouse', label:'Puoliso', classes:'(rels:Spouse, rels:Husband, rels:Wife)'},
        	{value:'reference', label:'Viittaus biografiatekstissä'}
        	];
        vm.relation = vm.RELATIONOPTIONS[0];
        
        vm.changerelation = function() {
        	console.log('changerelation', vm.relation.value)
        	$location.search('relation', vm.relation.value);
        	fetchResults({ constraint: vm.previousSelections });
        };
        
        
        vm.PROPERTYOPTIONS = [
        	{value:'occupation', label:'Ammatti', path:'foaf:focus/bioc:has_profession/skos:prefLabel'},
        	{value:'birthplace', label:'Synnyinpaikka', path:'foaf:focus/(^crm:P98_brought_into_life)/nbf:place/skos:prefLabel'},
        	{value:'deathplace', label:'Kuolinpaikka', path:'foaf:focus/(^crm:P100_was_death_of)/nbf:place/skos:prefLabel'}
        	];
        vm.property = vm.PROPERTYOPTIONS[0];
        
        vm.changeproperty = function() {
        	$location.search('property', vm.property.value);
        	fetchResults({ constraint: vm.previousSelections });
        };
        

        vm.LIMITOPTIONS = [{value:10, label:'10'},
        	{value:20, label:'20'},
        	{value:50, label:'50'},
        	{value:100, label:'100'},
        	{value:200, label:'200'},
        	{value:1e6, label:'ei rajaa'}];
        vm.limit = vm.LIMITOPTIONS[3];
        
        vm.changelimit = function() {
        	$location.search('limit',vm.limit.value);
        	fetchResults({ constraint: vm.previousSelections });
        };
        
        //    	set url parameters:
        var lc = $location.search();
        
        if (lc.limit) {
        	let val = parseInt(lc.limit);
        	vm.LIMITOPTIONS.forEach(function(ob, i) {
        		if (val==ob.value) vm.limit=vm.LIMITOPTIONS[i];
        	});
        }
        
        if (lc.property) {
        	let val = lc.property;
        	vm.PROPERTYOPTIONS.forEach(function(ob, i) {
        		if (val==ob.value) vm.property=vm.PROPERTYOPTIONS[i];
        	});
        }
        
        if (lc.relation) {
        	let val = lc.relation;
        	vm.RELATIONOPTIONS.forEach(function(ob, i) {
        		if (val==ob.value) vm.relation=vm.RELATIONOPTIONS[i];
        	});
        }
        
        // assign random ids to chart div so we can use same controller on comparison page
        vm.chart_ids = [0 /**,1,2,3,4*/ ].map(function(i) {
        	return(_.uniqueId());
        });
        
        vm.showForm = function () {
            $uibModal.open({
                templateUrl: 'views/popup.html',
                scope: $scope
            }).result.then(function(){}, function(res){});
        };

        vm.removeFacetSelections = removeFacetSelections;
        /*
        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
        	fetchResults(config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', fetchResults);
        */
        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);
        
        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint,
                    vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            return fetchResults(facetSelections);
        }

        var latestUpdate;
        
        visuNetService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }

        function getFacetOptions() {
            var options = visuNetService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }


        function fetchResults(facetSelections) {
        	/*
            if (vm.previousSelections && _.isEqual(facetSelections.constraint,
                vm.previousSelections)) {
                return;
            }
            */
            vm.previousSelections = _.clone(facetSelections.constraint);
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            
            //	getResults(facetSelections, relation, property)
            vm.messagecolor = 'blue';
            
            
            vm.hasdata = false;
            vm.isLoadingResults = true;
            
            visuNetService.getResults(facetSelections, vm.relation.classes, vm.property.path, vm.limit.value).then(function(data) {
            	vm.isLoadingResults = false;
            	if (data.length) {
            		google.charts.setOnLoadCallback(function () {
                        drawSankeyChart(data, 'Sukupuoli tai ryhmä', vm.chart_ids[0])
                    });
            		vm.head1 = vm.property.label;
                    vm.head2 = vm.property.label+': '+vm.relation.label.toLowerCase();
            		vm.hasdata = true;
            	} else {
            		vm.message ="Haulla ei löydy näytettävää dataa."
                    vm.messagecolor = 'red';
            		vm.head1 = "Ei tuloksia";
                    vm.head2 = "";
            	}
            });
        }
        
        function drawSankeyChart(res, label, target) {
        	var data = new google.visualization.DataTable();
	        data.addColumn('string', 'Vanhempi');
	        data.addColumn('string', 'Lapsi');
	        data.addColumn('number', 'Lukumäärä');
	        
	        //	res = [Object { label_1: "Ruotsin jaarli", label_2: "Suomen herttua", no: "1" }]
	        //
	        var rows = res.map(function(ob) {return [ob.label_1, ob.label_2+' ', parseInt(ob.no)]});
	        /*
	        var rows = res.map(function(ob) {
	        	return (ob.reverse=="true") ?
	        			[ob.label_2, ob.label_1+' ', parseInt(ob.no)] :
	        			[ob.label_1, ob.label_2+' ', parseInt(ob.no)] ;
	        		});
	        */
	        data.addRows(rows);
	        
			// Sets chart options.
	        var options = {
	          width: "100%",
	          height: 900,
	          sankey: { 
	        	  iterations : 32,
	        	  link: {
	        		  interactivity: true },
	        	  node: {
	        		  interactivity: false, 
	        		  label: { fontSize: 14 } 
	        	  } 
	          }
	        };
	
	        // Instantiates and draws our chart, passing in some options.
	        var chart = new google.visualization.Sankey(document.getElementById(target));
	        chart.draw(data, options);
        	
        	google.visualization.events.addListener(chart, 'select', function(e) {
            	var pie;
            	// console.log("click", chart);
            	try {
            		var sel = chart.getSelection();
            		console.log(sel);
            		console.log(rows[sel[0].row]);
            		/*
            		let pie = sel[0].row;
            		vm.people = vm.data[target][pie];
                    vm.popuptitle = arr[pie][0]+ ': '+arr[pie][1]+ ' tulosta';
                    vm.showForm();
                    */
            	} 
            	catch(err) {
            		console.log('Unhandled click');
            		return;
            	}
                
            });
            
        }
        

        function handleError(error) {
            console.log(error)
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
