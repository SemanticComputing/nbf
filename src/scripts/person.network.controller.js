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
    function PersonNetworkController($scope, $location, $state, _, $stateParams, networkService,
            FacetHandler) {

        var vm = this;
        vm.cy = null;
        vm.elems = {};
        vm.message = "";
        vm.dict = {};
        // vm.chosenNode = null;
        vm.loading = false;
        vm.showlegend = false;
        
        //	popover not used above the canvas element
        vm.popover = false;
		vm.popx = '200px';
		vm.popy = '200py';
		
        
        vm.COLORS = ['#3366CC', '#DC3912', '#FF9900', '#109618', 
    		'#990099', '#3B3EAC', '#0099C6', '#DD4477', 
    		'#66AA00', '#B82E2E', '#316395', '#994499', 
    		'#22AA99', '#AAAA11', '#6633CC', '#E67300', 
    		'#8B0707', '#329262', '#5574A6', '#3B3EAC', '#999' ];
    	
        vm.LIMITOPTIONS = [{value:10, label:'10'},
        	{value:20, label:'20'},
        	{value:50, label:'50'},
        	{value:100, label:'100'},
        	{value:200, label:'200'},
        	{value:500, label:'500'},
        	{value:1000, label:'1000'},
        	{value:1e6, label:'ei rajaa'}];
        vm.searchlimit = vm.LIMITOPTIONS[1];
        
        
        vm.changelimit = function() {
        	$location.search('limit',vm.searchlimit.value);
        	fetchResults({ constraint: vm.previousSelections });
        };
        
        vm.SIZEOPTIONS = [
        	{value:'Vakio', tooltip:false},
        	{value:'Etäisyys', tooltip:'Solmujen koko määräytyy keskushenkilöön johtavan linkkipolun etäisyyden perusteella.'},
        	{value:'Asteluku', tooltip:'Asteluku (degree) tarkoittaa henkilöstä lähtevien ja saapuvien linkkien kokonaismäärää.'},
        	{value:'Tuloaste', tooltip:'Tuloaste (indegree) tarkoittaa henkilöön saapuvien linkkien lukumäärää.'},
        	{value:'Lähtöaste', tooltip:'Lähtöaste (outdegree) tarkoittaa henkilöstä lähtevien linkkien lukumäärää.'},
        	{value:'Pagerank', tooltip:'Pagerank-algoritmi mittaa henkilön keskeisyyttä verkostossa.'}
        	];
        //	tuloaste (indegree)
        vm.sizeoption = vm.SIZEOPTIONS[1];
        
        vm.changesize = function() {
        	var i = vm.SIZEOPTIONS.indexOf(vm.sizeoption);
        	if (i>-1) {
        		$location.search('sizeoption', i);
        	}
        	
        	var str = '20 px';
        	
        	switch(vm.sizeoption) {
	            case vm.SIZEOPTIONS[1]:
	            	//	DIJKSTRA
	            	var dj = vm.cy.elements().dijkstra( {root:vm.cy.getElementById(vm.id)} );
	            	vm.elems.nodes.forEach(function (n) {
	            		var node = vm.cy.getElementById(n.data.id);
	            		n.data.dijkstra = -dj.distanceTo(node);
	            	});
	            	numeric2Size(vm.elems, 'dijkstra', 'size', 10, 50);
	            	str = 'data(size)';
	            	break;
	            case vm.SIZEOPTIONS[2]:
	            	//	DEGREE
	            	vm.elems.nodes.forEach(function (n) {
	            		var node = vm.cy.getElementById(n.data.id);
	            		n.data.degree = node.degree();
	            	});

            		numeric2Size(vm.elems, 'degree', 'size', 10, 50);
            		str = 'data(size)';
	                break;
	            case vm.SIZEOPTIONS[3]:
	            	//	INDEGREE
	            	vm.elems.nodes.forEach(function (n) {
	            		var node = vm.cy.getElementById(n.data.id);
	            		n.data.degree = node.indegree();
	            	});

            		numeric2Size(vm.elems, 'degree', 'size', 10, 50);
            		str = 'data(size)';
	                break;
	            case vm.SIZEOPTIONS[4]:
	            	//	OUTDEGREE
	            	vm.elems.nodes.forEach(function (n) {
	            		var node = vm.cy.getElementById(n.data.id);
	            		n.data.degree = node.outdegree();
	            	});

            		numeric2Size(vm.elems, 'degree', 'size', 10, 50);
            		str = 'data(size)';
	                break;
	            case vm.SIZEOPTIONS[5]:
	            	//	PAGERANK
	            	var pr = vm.cy.elements().pageRank();
		            vm.elems.nodes.forEach(function (n) {
	            		var node = vm.cy.getElementById(n.data.id);
	            		var rank = pr.rank(node);
	            		n.data.pagerank = rank;
	            	});
            		numeric2Size(vm.elems, 'pagerank', 'size', 10, 50);
            		str = 'data(size)';
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
        
        vm.COLOROPTIONS = [
        	{value:'Vakio', tooltip:false},
        	{value:'Sukupuoli', tooltip:'Henkilöt väritetään sukupuolen mukaan.'},
        	{value:'Toimiala', tooltip:'Henkilöt väritetään tietokannassa ilmoitetun toimialan mukaan.'},
        	{value:'Etäisyys', tooltip:'Solmujen väri määräytyy keskushenkilöön johtavan linkkipolun etäisyyden perusteella.'}];
        
        vm.coloroption = vm.COLOROPTIONS[3];
        
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
            		
	            case vm.COLOROPTIONS[3]:
	            	//	DIJKSTRA
	            	var dj = vm.cy.elements().dijkstra( {root:vm.cy.getElementById(vm.id)} );
	            	vm.elems.nodes.forEach(function (n) {
	            		var node = vm.cy.getElementById(n.data.id);
	            		n.data.dijkstra = dj.distanceTo(node);
	            	});
	            	category2Color(vm.elems, 'dijkstra', 'color');
	            	str = 'data(color)';
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
        
        //	set url parameters:
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
        
        if (lc.sizeoption) {
        	vm.sizeoption = vm.SIZEOPTIONS[parseInt(lc.sizeoption)];
        }
        
        
        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
        	fetchResults(event, config);
            initListener();
        });
        
        $scope.$on('sf-facet-constraints', fetchResults);
        
        vm.handler = new FacetHandler({scope : $scope});
        
        
        var latestUpdate;
        function fetchResults() {
            
            vm.error = undefined;
            vm.loading = true;
            
            if (vm.cy) {
            	vm.cy.elements().remove();
            }
            
            vm.message = '';
            vm.messagecolor = 'blue';
            
            vm.cy = null;
            vm.personId = $stateParams.personId;
            return networkService.getNodes($stateParams.personId, vm.searchlimit.value)
            .then(function(res) {
            	
            	if (res.length<2) {
            		vm.loading = false;
                	vm.message = "Henkilölle ei löydy näytettävää verkostoa.";
                	vm.messagecolor = 'red';
                	return;
            	}
            	
            	vm.elems.nodes = res.map(function(ob) { return { data: ob }});
            	
            	var ids = res.map(function(ob) { return ob.id.replace('http://ldf.fi/nbf/','nbf:'); }).join(' ');
            	
            	vm.label = res[0].label;
            	vm.id = $stateParams.personId;
            	
            	return networkService.getLinks(ids)
                .then(function(edges) {
                	
                	vm.elems.edges = edges.map(function(ob) { return {data: ob};});
                	
                	processData(vm);
                	
                	vm.loading = false;
                	
                	if (vm.elems.edges.length==vm.searchlimit.value) {
                		vm.message = "Näytetään {} ensimmäistä linkkiä ja {2} henkilöä"
                			.replace('{}', vm.searchlimit.value)
                			.replace('{2}', vm.elems.nodes.length);
                	} else {
                		vm.message = "Näytetään {} linkkiä ja {2} henkilöä"
                			.replace('{}', vm.elems.edges.length)
                			.replace('{2}', vm.elems.nodes.length);
                	}
                }).catch(handleError);
            	
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
	        		name: 'circle'
	        	},
	        	style: style
	            });
            
            vm.cy.on('click', 'node', function(evt){

            	document.body.style.cursor = "auto";
            	var id = this.id(),
            		link = '/'+ (id).replace(new RegExp('/', 'g'), '~2F')+'/verkosto';
            	
            	$location.url(link);
	          	$scope.$apply();
	    	});
            
            
            vm.cy.on('mouseover', 'node', function(evt){
            	document.body.style.cursor = "pointer";
        		/*
        		var x = evt.renderedPosition.x -40,
        			y = evt.renderedPosition.y -40;
        		
        		vm.popx = x + 'px';
        		vm.popy = y + 'px';
        		vm.popover = true;
        		vm.current = this.id();
        		$scope.$apply();
        		*/
         	});
        	
            vm.cy.on('mouseout', 'node', function(evt){
            	document.body.style.cursor = "auto";
            	/* vm.popover = false;
        		$scope.$apply(); */
        	});
        	
            vm.changecolor();
            vm.changesize();
            
            vm.cy.layout({
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
        		numIter: 800,
        		initialTemp: 200,
        		coolingFactor: 0.95,
        		minTemp: 1.0
	        }).run();
            
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
