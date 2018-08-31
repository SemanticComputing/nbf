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
    .controller('PersonNetworkController', PersonNetworkController);

    /* @ngInject */
    function PersonNetworkController($scope, $location, $state, _, $stateParams, personNetworkService,
            FacetHandler) {

        var vm = this;
        vm.cy = null;
        vm.elems = {};
        vm.message = "";
        vm.dict = {};
        vm.chosenNode = null;
        vm.loading = false;
        vm.showlegend = false;
        
        vm.COLORS = ['#3366CC', '#DC3912', '#FF9900', '#109618', 
    		'#990099', '#3B3EAC', '#0099C6', '#DD4477', 
    		'#66AA00', '#B82E2E', '#316395', '#994499', 
    		'#22AA99', '#AAAA11', '#6633CC', '#E67300', 
    		'#8B0707', '#329262', '#5574A6', '#3B3EAC', '#999' ];
    	
        vm.LIMITOPTIONS = [{value:100},{value:200},{value:500},{value:1000},{value:2500},{value:5000}];
        vm.searchlimit = vm.LIMITOPTIONS[1];
        
        vm.changelimit = function() {
        	fetchResults({ constraint: vm.previousSelections });
        };
        
        
        vm.SIZEOPTIONS = [{value:'Vakio'},{value:'Etäisyys'},{value:'Asteluku'},{value:'Pagerank'}];
        vm.sizeoption = vm.SIZEOPTIONS[1];
        
        vm.changesize = function() {
        	var str = '20 px';
        	switch(vm.sizeoption) {
	            case vm.SIZEOPTIONS[1]:
	            	//	DIJKSTRA
	            	var dj = vm.cy.elements().dijkstra( {root:vm.cy.getElementById(vm.id)} );
	            	vm.elems.nodes.forEach(function (n) {
	            		var node = vm.cy.getElementById(n.data.id);
	            		n.data.dijkstra = -dj.distanceTo(node);
	            	});
	            	numeric2Size(vm.elems, 'dijkstra', 'dijkstrasize', 10, 50);
	            	str = 'data(dijkstrasize)';
	            	break;
	            case vm.SIZEOPTIONS[2]:
	            	//	DEGREE
	            	vm.elems.nodes.forEach(function (n) {
	            		var node = vm.cy.getElementById(n.data.id);
	            		n.data.degree = node.degree();
	            	});

            		numeric2Size(vm.elems, 'degree', 'degreesize', 10, 50);
            		str = 'data(degreesize)';
	                break;
	            case vm.SIZEOPTIONS[3]:
	            	//	PAGERANK
	            	var pr = vm.cy.elements().pageRank();
		            vm.elems.nodes.forEach(function (n) {
	            		var node = vm.cy.getElementById(n.data.id);
	            		var rank = pr.rank(node);
	            		n.data.pagerank = rank;
	            	});
            		numeric2Size(vm.elems, 'pagerank', 'ranksize', 10, 50);
            		str = 'data(ranksize)';
	                break;
	            default:
	                break;
	            
	        }
        	
        	vm.cy.style()
        		.selector('node')
      	    		.style("height", str)
            		.style("width", str)
            	.update();
        };
        
        vm.COLOROPTIONS = [{value:'Vakio'},{value:'Sukupuoli'},{value:'Kategoria'},{value:'Etäisyys'}];
        vm.coloroption = vm.COLOROPTIONS[3];
        
        vm.changecolor = function() {
        	vm.showlegend = false;
        	var str;
        	
        	switch(vm.coloroption) {
	            case vm.COLOROPTIONS[1]:
	            	//	GENDER
	            	category2Color(vm.elems, "gender", "gendercolor");
	            	str = 'data(gendercolor)';
	            	vm.showlegend = true;
	            	break;
	            	
	            case vm.COLOROPTIONS[2]:
	            	//	CATEGORY
	            	category2Color(vm.elems, "category", "categorycolor");
            		str = 'data(categorycolor)';
            		vm.showlegend = true;
            		break;
            		
	            case vm.COLOROPTIONS[3]:
	            	//	DIJKSTRA
	            	var dj = vm.cy.elements().dijkstra( {root:vm.cy.getElementById(vm.id)} );
	            	vm.elems.nodes.forEach(function (n) {
	            		var node = vm.cy.getElementById(n.data.id);
	            		n.data.dijkstra = dj.distanceTo(node);
	            	});
	            	category2Color(vm.elems, 'dijkstra', 'dijkstracolor');
	            	str = 'data(dijkstracolor)';
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
        
        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
        	fetchResults(event, config);
            initListener();
        });
        
        $scope.$on('sf-facet-constraints', fetchResults);
        
        vm.handler = new FacetHandler({scope : $scope});
        
        Array.prototype.unique = function() {
      	  return this.filter(function (value, index, self) { 
      	    return self.indexOf(value) === index;
      	  });
      	}
        
        var latestUpdate;
        function fetchResults() {
            
            vm.error = undefined;
            vm.loading = true;
            
            if (vm.cy) {
            	vm.cy.elements().remove();
            }
            
            vm.message = '';
        	
            vm.cy = null;
            
            return personNetworkService.getLinks($stateParams.personId, vm.searchlimit.value)
            .then(function(res) {
            	
            	if (res.length<1) {
            		vm.message = "Hakuehdoilla ei löydy verkostoa.";
            		vm.loading = false;
            		return;
            	}
            	
            	
            	//	result to format:
            	/*	edges: [
                { data: { source: 'a', target: 'b' } },
                { data: { source: 'c', target: 'b' } },
                { data: { source: 'a', target: 'c' } },
                { data: { source: 'c', target: 'd' } }
                ]*/
            	
            	vm.elems.edges = res.map(function(ob) { return {data: ob};});
            	
            	var ids = res.map(function(ob) { return ob.source;}).concat(res.map(function(ob) { return ob.target;})).unique();
            	
            	return personNetworkService.getNodes(ids)
                 .then(function(res) {
                	 
                	vm.elems.nodes = res.map(function(ob) { return { data: ob }});
                	
                	//  detect person's name and id to show on the page
                	vm.dict = {};
                	res.forEach(function(ob) { vm.dict[ob.id] = ob.label });
                	vm.id = $stateParams.personId;
            		if (vm.dict.hasOwnProperty(vm.id)) {
            			vm.label = vm.dict[vm.id];
            		}
            		
                	processData(res, vm);
                	
                	vm.loading = false;
                	
                	if (vm.elems.edges.length==vm.searchlimit.value) {
                		vm.message = "Näytetään {} ensimmäistä linkkiä ja {2} henkilöä"
                			.replace('{}', vm.searchlimit.value)
                			.replace('{2}', vm.elems.nodes.length);
                	} else {
                		vm.message = "Näytetään {} linkkiä ja {2} henkilöä"
                			.replace('{}', vm.elems.edges.length)
                			.replace('{2}', vm.elems.nodes.length);;
                	}
                 });
            	
            }).catch(handleError);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
        
        
        function processData(res, vm) {
        	
    		var style = [
    	        {
    	            selector: 'node',
    	            style: {
    	                "shape": 'ellipse',
	    				"height": '20',
	    	      		"width": '20',
		    			"text-valign": "center",
		    			"text-halign": "right",
		    			"content": '  data(label)',
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
    	            	'width': 2,
    	                'line-color': '#666',
    	                'curve-style': 'bezier',
    	        		'target-arrow-shape': 'triangle',
    	        		'target-arrow-color': '#666'
    	            }
    	        }
    	        ];
    		
            vm.cy = cytoscape({
                container: document.getElementById('personnetworkcontainer'),
                elements: vm.elems,
                wheelSensitivity: 0.2,
	        	layout: {
	        		name: 'cose',
	        		idealEdgeLength: 100,
	        		nodeOverlap: 20,
	        		refresh: 20,
	        		fit: true,
	        		padding: 30,
	        		randomize: false,
	        		componentSpacing: 100,
	        		nodeRepulsion: 400000,
	        		edgeElasticity: 100,
	        		nestingFactor: 5,
	        		gravity: 80,
	        		numIter: 1000,
	        		initialTemp: 200,
	        		coolingFactor: 0.95,
	        		minTemp: 1.0
	        	},
	        	style: style
	              });
            
            var changePerson = function(evt){

            	document.body.style.cursor = "auto";
            	var id = this.id(),
            		link = '/'+ (id).replace(new RegExp('/', 'g'), '~2F')+'/henkiloverkosto';
            	
            	$location.url(link);
	          	$scope.$apply();
	    	}
            
            vm.cy.on('click', 'node', changePerson);
            
            // vm.cy.on('drag', 'node', showNodeInfo);
            
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
        }
        
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
