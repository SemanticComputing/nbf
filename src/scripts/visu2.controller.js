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
    .controller('VisuController2', VisuController2);

    /* @ngInject */
    function VisuController2($scope, $location, $q, $state, _, visuService,
            FacetHandler, facetUrlStateHandlerService) {

        var vm = this;
   
        vm.people = []; 
        vm.startYear = [];
        //vm.topTitles = [];
        //vm.topOrgs = [];
		vm.removeFacetSelections = removeFacetSelections;
		
		google.charts.load('current', {packages: ['corechart', 'line']});

        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);

        visuService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }

        function getFacetOptions() {
            var options = visuService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }


        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint,
                    vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            return fetchResults(facetSelections).then(function (people) {
            	google.charts.setOnLoadCallback(function () { drawYearChart(vm.ages, 'Elinikä', 'chart_age')});
            	google.charts.setOnLoadCallback(function () { drawYearChart(vm.marriageAges, 'Naimisiinmenoikä', 'chart_marriageAge')});
            	google.charts.setOnLoadCallback(function () { drawYearChart(vm.firstChildAges,'Lapsensaanti-ikä', 'chart_firstChildAge')});
            	//google.charts.setOnLoadCallback(function () { drawYearChart("1", 'Valmistumisvuosi Norssista', 'chart_matriculationYear') });
            	
            	//google.charts.setOnLoadCallback(function () { drawColumnChart(vm.topSchools, 'Yleisimmät oppilaitokset vuosikymmenittäin', 'chart_topschools') });
            	//google.charts.setOnLoadCallback(function () { drawColumnChart(vm.topTitles, 'Yleisimmät virat ja toimet vuosikymmenittäin', 'chart_topeducation') });
            	//google.charts.setOnLoadCallback(function () { drawColumnChart(vm.topOrgs, 'Yleisimmät työnantajat vuosikymmenittäin', 'chart_toporganization') });
            	
            	return;
	         });
        }
        
        
        function drawColumnChart(data, label, target) {
        	var res = {}, clusters=0;
        	
        	$.each(data, function( i, value ) {
        		if (value.hasOwnProperty('label')) {
					var y = (value['label']);
					if (!res.hasOwnProperty(y)) { 
						res[y]={}; 
						clusters++;
					};
					res[y][parseInt(value['year'])] = parseInt(value['count']);
				}
			});
        	
            if (res==={} || clusters==0) { 
            	data = [];
            	for (var i= 1890; i<2000; i+=10) data.push({count:"0", label:"No results", year:""+i});
            	return drawColumnChart(data, label, target);
            	}
            
        	var data = new google.visualization.DataTable();
            data.addColumn('string', 'X');
            
        	var rows = {},
        		iter = 1,
        		zeros=[];
        	for (var i=0; i<clusters; i++) zeros.push(0);
        	
        	
        	$.each(res, function( key, values ) {
        		data.addColumn('number', key);
        		$.each(values, function( y, count ) {
        			var year = (y);
            		if (!rows.hasOwnProperty(year)) rows[year] = [year].concat(zeros);
            		rows[year][iter] += parseInt(count);
    			});
        		iter++;
			});
        	
        	rows = $.map( rows, function( value, key ) {
				return [ value ];
			});
        	var hticks = $.map( rows, function( value, key ) { return [ value[0] ]; });
        	
        	data.addRows(rows);
            
            var options = {
            		title: label,
            		hAxis: {
            			title: 'Vuosikymmen',
            			ticks: hticks,
            			gridlines: { color: 'none' }
            		},
            		vAxis: {
            			title: 'Henkilöä'
            		}
            	};

            var chart = new google.visualization.ColumnChart(document.getElementById(target));
            chart.draw(data, options);
          }
        
        
		function drawYearChart(res, label, target) {
			var 
				arr = $.map( countByYear(res),
					function( value, key ) {
						return [[ value[0],value[1] ]];
					}),
				stats = getStats(arr),
				
				data = new google.visualization.DataTable(),
				options = {
				    title: label+", keskiarvo: "+stats[0].toFixed(2) +', standardipoikkeama: '+stats[1].toFixed(2) ,
				    legend: { position: 'none' },
				    
            		tooltip: {format: 'none'},
				    colors: ['blue'],
				    
				    hAxis: {
				    	slantedText:false, 
				    	maxAlternation: 1, 
				    	format: '',
				    	ticks: [10,20,30,40,50,60,70,80,90,100]
				    
				    	},
				    vAxis: {
				    	 maxValue: 4
				    },
			    	width: '95%', 
			    	bar: {
			    	      groupWidth: '88%'
			    	    },
			    	height:500
				  },
			
				chart = new google.visualization.ColumnChart(document.getElementById(target));
			
	        data.addColumn('number', 'Ikä');
	        data.addColumn('number', 'Henkilöä');
	        
			data.addRows(arr);
			chart.draw(data, options);
		}
		
    
		
		function getStats(data) {
			var sum=0.0,
				sum2=0.0,
				count=0;
			
			$.each(data, function( i, value ) {
				var x = value[0]*value[1];
				sum += x;
				sum2 += value[0]*x;
				count += value[1];
			});
			if (count>0) {
				//	median, standard deviation
				var mu=sum/count;
				return [mu, Math.sqrt(sum2/count-mu*mu)];
			} 
			return [0.0, 0.0];
		}
		
		function countByProperty(data, prop) {
			return countProperties(data, prop)
				.sort(function(a, b){ return b[1]-a[1] });
    	}
		
    	
		function countByYear(data) {
			var res = [];
			
			$.each(data, function( i, value ) {
				//if (value.hasOwnProperty('index') && value['index']==index) {
					res.push([ parseInt(value['age']), parseInt(value['count']) ]);
				//}
			});
			
			//	fill missing years with zero value
			res=fillEmptyYears(res);
			
			//	padding if only one result:
			if (res.length<2) {
				// add year before with zero result
				var y=parseInt(res[0][0])-1;
				res = [[y,0]].concat(res);
				
				// ... and after
				y=parseInt(res[res.length-1][0])+1;
				res.push([y,0]);
			}
			
			return res ;
    	}
		
		
		function fillEmptyYears(data) {
			if (data.length<2) return data;
			data.push([120, 0]);
			
			var res=[],
				y=parseInt(data[0][0]);
			if (y>1) {
				data.unshift([1, 0]);
				y=1;
			}
			for (var i=0; i<data.length; i++) {
				var y2=parseInt(data[i][0]);
				//	fill missing years in the sequence with zero values:
				while (y<y2) {
					res.push([y, 0]);
					y++;
				}
				res.push(data[i]);
				y++;
			}
			return res;
		}
		
		function countProperties(data, prop) {
			var res = {};
			$.each(data, function( i, value ) {
				if (value.hasOwnProperty(prop)) {
					var y=value[prop];
					
					if (res.hasOwnProperty(y)) {
						res[y] += 1;
					} else {
						res[y] = 1;
					}
				}
			});
			return $.map( res, function( value, key ) {
				return [[key, value]];
			});
    	}
		
		
        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.ages = [];
            vm.marriageAges = [];
            vm.firstChildAges = [];
            //vm.topOrgs = [];
            //vm.topSchools = [];
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return visuService.getResults(facetSelections).then(function(res) {
            	if (latestUpdate !== updateId) {
                    return;
                }
            	
                vm.isLoadingResults = false;
                vm.ages = res[0];
                vm.marriageAges = res[1];
                vm.firstChildAges = res[2];
                //vm.topTitles = res[2];
                //vm.topOrgs = res[3];
                //vm.topSchools = res[4];
                return res;
            }).catch(handleError);
        }

        function handleError(error) {
        	console.log(error)
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
