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
        
        vm.limitoptions = [{value:200},{value:500},{value:1000},{value:2500},{value:5000}];
        vm.SEARCHLIMIT = vm.limitoptions[1];
        
        vm.change = function() {
        	fetchResults({ constraint: vm.previousSelections });
        };
        
        vm.message = "";
        // vm.heatmap = null;
        
        vm.isScrollDisabled = isScrollDisabled;
        vm.removeFacetSelections = removeFacetSelections;
        vm.getSortClass = groupmapService.getSortClass;
        
        vm.showForm = function () {
            var modalInstance = $uibModal.open({
                templateUrl: 'views/popup.html',
                scope: $scope
            });
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

        function openPageOLD(person) {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return person; }
                }
            });
        }

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

        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.error = undefined;
            
            var updateId = _.uniqueId();
            latestUpdate = updateId;
            
            vm.polylines = [];
            
            return groupmapService.getResults2(facetSelections, vm.SEARCHLIMIT.value)
            .then(function(res) {
            	vm.isLoadingResults = false;
            	vm.message = "";

            	if (res.length<1) {
            		vm.message = "Haku ei tuottanut tuloksia."
            		return;
            	}
            	
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
        	
        	var arr = events.map(function(evt) { return eventToObject(evt); });
        	
        	var flatten = function (arr) {
        		  return arr.reduce(function (flat, toFlatten) {
        		    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
        		  }, []);
        		};
        	
        	vm.polylines = flatten(arr); 
        }
        
        var idcount = 0;
        
        var midPoint = function (x,y) {
    		var a = new google.maps.LatLng(x.latitude, x.longitude),
    			b = new google.maps.LatLng(y.latitude, y.longitude);
    		return google.maps.geometry.spherical.interpolate(a, b, 0.5);
    	};
    	
        function eventToObject(evt) {
        	
        	var randomColor = 'hsl('+(100+120*Math.random())+', 100%, 25%)',
        		hiliteColor = 'blue', // "hsl(160, 100%, 60%)",
        		mapaverageColor = 'rgb(203,231,226)',
        		hoverOpacity = 0.03,
        		hoverWeight = 6;
        	
        	var obj = [];

        	var middle = midPoint(evt.birth, evt.death);
            
        	obj.push(
        			{
    	        		id: idcount++,
    	        		path: [ evt.birth, evt.death ],
    	        		events: {
    	        			'click': function(obj) { 
    	        				/*
    	        				vm.place_label = "Syntymäpaikka "+evt.birth.label+", kuolinpaikka "+evt.death.label+" ("+evt.count+")";
    		        			vm.people = evt.person.ids ;
    		        			
    		        			vm.showWindow();
    		        			
    		        			$scope.$apply();
    		        			*/
    	        				
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
            		},
	        		{
		        		id: idcount++,
		        		path: [ evt.birth, middle ],
		        		stroke: {
		        			color: 'blue' ,
		        			weight: evt.weight
		        		}
	        		},{
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
	        		}
        		);
        	return obj;
        };
        
        /*
        function eventToObjectSingleColor(evt) {
        	
        	var randomColor = 'hsl('+(100+120*Math.random())+', 100%, 25%)',
        		hiliteColor = 'blue', // "hsl(160, 100%, 60%)",
        		mapaverageColor = 'rgb(203,231,226)';
        	
        	var obj = [];
        	
        	if (evt.weight<4) {
        		obj.push({
            		id: idcount++,
            		path: [ evt.birth, evt.death ],
            		events: {
            			'click': function(obj) { 
            				
            				vm.place_label = "Syntymäpaikka "+evt.birth.label+", kuolinpaikka "+evt.death.label+" ("+evt.count+")";
    	        			vm.people = evt.person.ids ;
    	        			
    	        			vm.showWindow();
    	        			
    	        			$scope.$apply();
    	        			},
	        			'mouseover': function(obj) { 
	        				obj.setOptions({
	        					strokeWeight: evt.weight+2, 
	        					strokeColor: hiliteColor,
	        					strokeOpacity: 1.0
	        						}); },
	        			'mouseout': function(obj) { 
	        				obj.setOptions({
	        					strokeWeight: 8, 
	        					strokeColor: mapaverageColor,
	        					strokeOpacity: 0.1
	        						}); }
            		},
            		stroke: {
            			color: mapaverageColor ,
            			weight: 8 ,
            			opacity: 0.1
            		}
            	});
        	}
        	
        	obj.push({
        		id: idcount++,
        		path: [ evt.birth, evt.death ],
        		events: {
        			'click': function(obj) { 
        				vm.place_label = "Syntymäpaikka "+evt.birth.label+", kuolinpaikka "+evt.death.label+" ("+evt.count+")";
	        			vm.people = evt.person.ids ;
	        			
	        			vm.showWindow();
	        			
	        			$scope.$apply();
	        			},
        			'mouseover': function(obj) { 
        				obj.icons[0].icon.scale = evt.weight+2;
        				obj.setOptions({strokeWeight: evt.weight+2, strokeColor: hiliteColor}); },
        			'mouseout': function(obj) { 
        				obj.icons[0].icon.scale = evt.weight;
        				obj.setOptions({strokeWeight: evt.weight, strokeColor: randomColor}); }
        		},
        		stroke: {
        			color: randomColor ,
        			weight: evt.weight
        		},
        		icons: [{
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                        scale: evt.weight
                    }
                }]
        	});
        	return obj;
        };
        */
        
    }
})();
