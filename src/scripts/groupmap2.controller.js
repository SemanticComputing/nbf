/*
 * Semantic faceted search
 *
 */

(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')
    
    /*
    * Controller for the results view.
    */
    .controller('GroupmapController2', GroupmapController2);

    /* @ngInject */
    function GroupmapController2($scope, $location, $state, $uibModal, _, groupmapService,
            FacetHandler, facetUrlStateHandlerService, EVENT_FACET_CHANGED) {

    	
        var vm = this;
        vm.map = { center: { latitude: 62, longitude: 24 }, zoom: 6 };
        vm.window = { show: false, 
        		position: {
        			lat: 60.192059,
        			lng: 24.945831}
        };
        
        vm.LIMITOPTIONS = [{value:200},{value:500},{value:1000},{value:2500},{value:5000}];
        vm.searchlimit = vm.LIMITOPTIONS[0];
        
        vm.change = function() {
        	$location.search('limit', vm.searchlimit.value);
        	fetchResults({ constraint: vm.previousSelections });
        };
        
        vm.message = "";
        
        vm.isScrollDisabled = isScrollDisabled;
        vm.removeFacetSelections = removeFacetSelections;
        vm.getSortClass = groupmapService.getSortClass;
        
        vm.showForm = function () {
            var modalInstance = $uibModal.open({
                templateUrl: 'views/popup.html',
                scope: $scope
            }).result.then(function(){}, function(res){});
        };
        
        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);

        groupmapService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }
        /*
        function openPageOLD(person) {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return person; }
                }
            });
        }
		*/
        function getFacetOptions() {
            var options = groupmapService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }

        function isScrollDisabled() {
            return vm.isLoadingResults || nextPageNo > maxPage;
        }

        function sortBy(sortBy) {
        	groupmapService.updateSortBy(sortBy);
            return fetchResults({ constraint: vm.previousSelections });
        }

        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint,
                    vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            return fetchResults(facetSelections);
        }

        // set url parameters:
        var lc = $location.search();
        
        if (lc.limit) {
        	var lim = parseInt(lc.limit);
        	vm.LIMITOPTIONS.forEach(function(ob, i) {
        		if (lim==ob.value) vm.searchlimit=vm.LIMITOPTIONS[i];
        	});
        }
           
        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.error = undefined;
            
            var updateId = _.uniqueId();
            latestUpdate = updateId;
            
            vm.polylines = [];
            
            return groupmapService.getResults2(facetSelections, vm.searchlimit.value)
            .then(function(res) {
            	vm.isLoadingResults = false;
            	
            	if (res.length<1) {
            		vm.message = "Haku ei tuottanut tuloksia."
            		return;
            	}
            	
    			vm.message = (res.length<vm.searchlimit.value) ?
            			"Haku tuotti "+(res.length)+" paikkatulosta." :
            			"Kartalla näytetään "+(res.length)+" ensimmäistä paikkaa.";
                    			
            	processEvents(res, vm);
            	
            }).catch(handleError);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
        
        function processEvents(events, vm) {

        	//	normalize to counts to range [minweight, maxweight]
        	var minweight = 1,
        		maxweight = 9,
        		a = 1.0,
        		b = 0,
        		mincount = events[0].count,
    			maxcount = events[events.length-1].count;
        	
        	if (maxcount!=mincount) {
        		a = (maxweight-minweight)/(maxcount-mincount);
        		b = minweight-a*mincount;
        	}
        	
	        events.forEach( function(evt) {
	        	evt.weight = a*evt.count+b;
	        });
        	
	        var polylines = [], 
	        	markers = [];
        	
	        events.forEach(function(evt) { eventToObject(evt, polylines, markers); });
        	
        	vm.polylines = polylines;
        	vm.markers = markers;
        }
        
        var idcount = 0;
        
        var midPoint = function (x,y) {
    		var a = new google.maps.LatLng(x.latitude, x.longitude),
    			b = new google.maps.LatLng(y.latitude, y.longitude);
    		return google.maps.geometry.spherical.interpolate(a, b, 0.5);
    	};
    	
        function eventToObject(evt, polylines, markers) {
        	
        	var randomColor = 'hsl('+(100+120*Math.random())+', 100%, 25%)',
        		hiliteColor = 'blue', // "hsl(160, 100%, 60%)",
        		mapaverageColor = 'rgb(203,231,226)',
        		hoverOpacity = 0.03,
        		hoverWeight = 6;
        	
        	
        	if (evt.birth.label==evt.death.label) {
        		//	same place of birth and death
        		var r = 8.0*Math.sqrt(evt.weight);
        	
        		markers.push({
	        			"count": evt.weight,
	        			"latitude": evt.birth.latitude,
	        			"longitude": evt.birth.longitude,
	        			"id": idcount++,
	        			"options": {
	        				icon:{
		        				path:"M-"+r+" 0 A "+r+","+r+", 0 ,1, 1,"+r+",0 A"+r+","+r+",0,1,1,-"+r+",0 Z",
								scale: 1.0,
								anchor: new google.maps.Point(0,0),
								fillColor: 'red',
								strokeColor: 'blue',
								fillOpacity: 0.6
								},
							optimized: true, 
							title: evt.birth.label+": "+evt.count
							},
		        		"click": function () {
		        			vm.popuptitle = "Synnyin- ja kuolinpaikka "+evt.birth.label+": "+evt.count;
		        			vm.people = evt.person.ids;
		        			vm.showForm();
	        		}
	        	});
        		return;
        	}
        	
        	//	tooltip: https://stackoverflow.com/questions/5112867/google-maps-v3-polyline-tooltip
        	polylines.push(
        			{
    	        		id: idcount++,
    	        		path: [ evt.birth, evt.death ],
    	        		events: {
    	        			'click': function(obj) { 
    	        				vm.popuptitle = "Syntymäpaikka "+evt.birth.label+", kuolinpaikka "+evt.death.label+" ("+evt.count+")";
    		        			vm.people = evt.person.ids ;
    		        			vm.showForm();
    		        			},
    	        			'mouseover': function(obj) { 
    	        				obj.setOptions({
    	        					strokeColor: 'blue',
    	        					strokeOpacity: 1.0}); },
    	        			'mouseout': function(obj) { 
    	        				obj.setOptions({
    	        					strokeColor: mapaverageColor,
    	        					strokeOpacity: hoverOpacity}); }
    	        		},
    	        		stroke: {
    	        			color: mapaverageColor,
    	        			weight: hoverWeight,
    	        			opacity: hoverOpacity
    	        		},
		        		icons: [{
		                    icon: {
		                        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
		                        scale: 4
		                    }
		                }]
            		});
        	
        	var middle = midPoint(evt.birth, evt.death);
        	
        	polylines.push({
		        		id: idcount++,
		        		path: [ evt.birth, middle ],
		        		stroke: {
		        			color: 'blue' ,
		        			weight: evt.weight
		        		}
	        		});
        	
        	polylines.push({
		        		id: idcount++,
		        		path: [ middle, evt.death ],
		        		stroke: {
		        			color: 'red' ,
		        			weight: evt.weight
		        		},
		        		icons: [{
		                    icon: {
		                        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
		                        scale: evt.weight
		                    }
		                }]
	        		});
        };
        
        
        
    }
})();
