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
    .controller('PointcloudController', PointcloudController);

    /* @ngInject */
    function PointcloudController($scope, $location, $state, $uibModal, _, networkService,
            FacetHandler, facetUrlStateHandlerService, EVENT_FACET_CHANGED) {

    	var vm = this;
        vm.cy = null;
        vm.elems = {};
        vm.message = "";
        vm.dict = {};
        // vm.chosenNode = null;
        vm.loading = false;
        vm.showlegend = false;
        
        vm.showWindow = function() {
        	vm.window.show = true;
        }
        vm.closeWindow = function() {
        	vm.window.show = false;
        }
        
        vm.COLORS = ['#3366CC', '#DC3912', '#FF9900', '#109618',
    		'#990099', '#3B3EAC', '#0099C6', '#DD4477',
    		'#66AA00', '#B82E2E', '#316395', '#994499',
    		'#22AA99', '#AAAA11', '#6633CC', '#E67300',
    		'#8B0707', '#329262', '#5574A6', '#3B3EAC', '#999' ];
    	
        vm.LIMITOPTIONS = [
        	{value:100, label:'100'},
        	{value:200, label:'200'},
        	{value:500, label:'500'},
        	{value:1000, label:'1000'},
        	{value:2000, label:'2000'},
        	{value:5000, label:'5000'},
        	{value:10000, label:'10000'},
        	{value:1e6, label:'ei rajaa'}];
        vm.searchlimit = vm.LIMITOPTIONS[3];
        
        vm.changelimit = function() {
        	$location.search('limit',vm.searchlimit.value);
        	fetchResults({ constraint: vm.previousSelections });
        };
        
        
        vm.SIZEOPTIONS = [
        	{value:5, label:'5'},
        	{value:10, label:'10'},
        	{value:20, label:'20'},
        	{value:50, label:'50'}];
        vm.textsize = vm.SIZEOPTIONS[2];
        
        vm.changetextsize = function() {
        	if (vm && vm.cy) {
	        	vm.cy.style()
	    		.selector('node')
	  	    		.style("font-size", vm.textsize.value)
	        	.update();
        	}
        };
        
        vm.POINTSIZEOPTIONS = [
        	{value:5, label:'5'},
        	{value:10, label:'10'},
        	{value:20, label:'20'},
        	{value:50, label:'50'}];
        vm.pointsize = vm.POINTSIZEOPTIONS[2];
        
        vm.changepointsize = function() {
        	if (vm && vm.cy) {
	        	vm.cy.style()
	    		.selector('node')
	  	    		.style("width", vm.pointsize.value)
	  	    		.style("height", vm.pointsize.value)
	        	.update();
        	}
        };
        
        vm.COLOROPTIONS = [
        	{value:'Vakio', tooltip:'Tästä voit valita miten solmun väri määräytyy'},
        	{value:'Sukupuoli', tooltip:'Henkilöt väritetään sukupuolen mukaan.'},
        	{value:'Toimiala', tooltip:'Henkilöt väritetään tietokannassa ilmoitetun toimialan mukaan.'}
        	//, {value:'Etäisyys', tooltip:'Solmujen väri määräytyy keskushenkilöön johtavan linkkipolun etäisyyden perusteella.'}
        	];
        
        vm.coloroption = vm.COLOROPTIONS[0];
        
        vm.changecolor = function() {
        	var i = vm.COLOROPTIONS.indexOf(vm.coloroption);
        	if (i>-1) {
        		$location.search('coloroption', i);
        	}
        	
        	vm.showlegend = false;
        	var str;
        	
        	switch(vm.coloroption) {
	            case vm.COLOROPTIONS[1]:
	            	//	GENDER
	            	category2Color(vm.elems, "gender", "color");
	            	str = 'data(color)';
	            	vm.showlegend = true;
	            	break;
	            	
	            case vm.COLOROPTIONS[2]:
	            	//	CATEGORY
	            	category2Color(vm.elems, "category", "color");
            		str = 'data(color)';
            		vm.showlegend = true;
            		break;
            		
	            default:
	            	str = vm.COLORS[0]
	                break;
	            
	        }
        	
        	vm.cy.style()
        		.selector('node')
      	    		.style('background-color', str )
            	.update();
        };
        
//    	set url parameters:
        var lc = $location.search();
        
        if (lc.limit) {
        	var lim = parseInt(lc.limit);
        	vm.LIMITOPTIONS.forEach(function(ob, i) {
        		if (lim==ob.value) vm.searchlimit=vm.LIMITOPTIONS[i];
        	});
        }

        if (lc.coloroption) {
        	vm.coloroption = vm.COLOROPTIONS[parseInt(lc.coloroption)];
        }
        
        vm.isScrollDisabled = isScrollDisabled;
        vm.removeFacetSelections = removeFacetSelections;
        vm.getSortClass = networkService.getSortClass;
        
        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        
        $scope.$on('sf-facet-constraints', updateResults);

        networkService.getFacets().then(function(facets) {
        	vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }

        function openPage(person) {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return person; }
                }
            });
        }

        function getFacetOptions() {
            var options = networkService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }

        function isScrollDisabled() {
            return vm.isLoadingResults || nextPageNo > maxPage;
        }

        function sortBy(sortBy) {
        	networkService.updateSortBy(sortBy);
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
            
            vm.error = undefined;
            if (vm.cy) {
            	vm.cy.elements().remove();
            }
            
            vm.cy = null;
            vm.message = "";
            vm.loading = true;
            
            var updateId = _.uniqueId();
            latestUpdate = updateId;
            
            //	Search links first
            return networkService.getCloudNodes(facetSelections, vm.searchlimit.value)
            .then(function(nodes) {
            	
            	vm.loading = false;
            	
            	if (nodes.length<1) {
            		vm.message = "Asetuksilla ei löydy näytettävää verkostoa.";
                	vm.messagecolor = 'red';
                	return;
            	}
            	
            	//	{ data: { id: 'd' }, "position": { "x": 100, "y": 100 } }
            	vm.elems.nodes = nodes.map(function(ob) { return { data:ob , position: {x: 36*parseFloat(ob.x), y: 36*parseFloat(ob.y) }};});
            	vm.elems.edges = [];
            	
            	if (vm.elems.nodes.length==vm.searchlimit.value) {
                		vm.message = "Näytetään {} henkilöä"
                			.replace('{}', vm.elems.nodes.length);
                } else {
                		vm.message = "Näytetään {} henkilöä"
                			.replace('{}', vm.elems.nodes.length);
                }
            	
            	processData(vm);
            	
            	
            }).catch(handleError);
             
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
        
        function processData(vm) {
    		var style = [
    	        {
    	            selector: 'node',
    	            style: {
    	                "shape": 'ellipse',
	    				"height": '20',
	    	      		"width": '20',
	    	      		"font-size": vm.textsize.value,
		    			"text-valign": "center",
		    			"text-halign": "right",
		    			"content": 'data(label)',
		    			'background-color': vm.COLORS[0],
                        'color': '#888'
    	            }
    	        },
                {
                    selector: ':active',
                    style: {
                        'background-color': '#800',
                        'color': '#000'
                    }
                },
    	        {
    	            selector: 'edge',
    	            style: {
    	            	'width': 1,
    	                'line-color': '#999',
    	                'curve-style': 'bezier',
    	        		'target-arrow-shape': 'triangle',
    	        		'target-arrow-color': '#999'
    	            }
    	        }
    	        ];
    		
            vm.cy = cytoscape({
                container: document.getElementById('networkcontainer'),
                elements: vm.elems,
                wheelSensitivity: 0.2,
	        	layout: {
	        		name: 'preset',
	        		fit: true
	        	},
	        	style: style
	            });
            
            vm.cy.on('click', 'node', function(evt){

            	document.body.style.cursor = "auto";
            	
            	$state.go('person.network',{ personId: (this.id()).replace(/^.+?(p[0-9]+)$/, '$1') });
            	
	    	});
            
            vm.cy.on('mouseover', 'node', function(evt){
            	document.body.style.cursor = "pointer";
         	});
        	
            vm.cy.on('mouseout', 'node', function(evt){
            	document.body.style.cursor = "auto";
        	});
            
            vm.changecolor();
            vm.changesize();
            
            
            if (vm.cy.panzoom) {
            	vm.cy.panzoom({}); 
            };
            
        };
        
        var category2Color = function (elems, prop, newprop) {
    		var dct = {};
    		
    		elems.nodes.forEach(function(ob) {
    			var val = ''+ob.data[prop];
    			if (!dct.hasOwnProperty(val)) dct[val]=0;
    			dct[val]++;
    		});
    		
    		var arr = [];
    		for (var val in dct) {
    			arr.push({count: dct[val], label:val});
    		}
    		arr.sort(function(a, b) { return b.count - a.count; });
    		
    			
    		dct = {};
    		arr.forEach(function (ob, i) {
    			dct[ob.label] = i<vm.COLORS.length ? vm.COLORS[i] : vm.COLORS[vm.COLORS.length-1] ;
    		});
    		
    		vm.legend = arr.map(function(ob,i) { 
    			return {
    				label: (''+ob.label=='undefined' ? 'ei tiedossa' : ob.label), 
    				color:vm.COLORS[i]}; });
    		
    		var n = vm.COLORS.length;
    		if (vm.legend.length>n) {
    			vm.legend = vm.legend.slice(0,n);
    			vm.legend[n-1].label = 'muut';
    		}
    		
    		elems.nodes.forEach(function(ob) {
    			var val = ob.data[prop];
    			ob.data[newprop] = dct[val];
    		});
    	};
    	
    	var numeric2Size = function (elems, prop, newprop, min, max) {
    		if (elems.nodes.length<1) return;
    		
    		var minval = elems.nodes[0].data[prop], 
    			maxval = minval;
    		
    		elems.nodes.forEach(function(ob) {
    			var val = ob.data[prop];
    			if (val<minval) minval=val;
    			if (maxval<val) maxval=val;
    		});
    		
    		if (minval==maxval) maxval += 1;
    		
    		var a = (max-min)/(maxval-minval),
    			b = min - minval/(maxval-minval)*(max-min);
    			
    		elems.nodes.forEach(function(ob) {
    			var val = ob.data[prop];
    			ob.data[newprop] = val*a + b; 
    		});

    	};
    	
    }
})();
