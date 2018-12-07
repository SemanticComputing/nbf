/*
 * facetApp module definition
 */
(function() {

    'use strict';

    angular.module('facetApp', [
        'ui.router',
        'seco.facetedSearch',
        'ngTable',
        'angular.filter',
        'ngAnimate',
        'ui.bootstrap',
        'infinite-scroll',
        'uiGmapgoogle-maps',
        'rzModule'
    ])

    .constant('_', _) // eslint-disable-line no-undef
    .constant('google', google) // eslint-disable-line no-undef
    .constant('RESULTS_PER_PAGE', 25)
    .constant('PAGES_PER_QUERY', 1)

    .value('SPARQL_ENDPOINT_URL', 'https://ldf.fi/nbf/sparql')

    .run(function(authStorage) {
        authStorage.init();
    })

    .run(function(google) {
        google.charts.load('current', { packages: ['corechart', 'line'] });
    })

    .config(function($urlMatcherFactoryProvider) {
        $urlMatcherFactoryProvider.strictMode(false);
    })



    .service('authInterceptor', function ($q, $state) {
        this.responseError = function(response) {
            if (response.status == 401) {
                $state.go('login');
            }
            return $q.reject(response);
        };
    })

    .config(function($httpProvider) {
        $httpProvider.interceptors.push('authInterceptor');
    })

    .config(function($locationProvider) {
        $locationProvider.html5Mode(true);
    })

    .config(function($stateProvider) {
        $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'views/login.html',
            controller: 'LoginController',
            controllerAs: 'vm'
        })
        .state('portal', {
            url: '',
            templateUrl: 'views/portal.html',
            controller: 'PortalController',
            controllerAs: 'vm'
        })

        .state('person', {
            abstract: true,
            url: '/henkilo/:personId',
            templateUrl: 'views/person/tabs.html'
        })
        .state('person.detail', {
            url: '?tab',
            templateUrl: 'views/person/detail.html',
            params: {
            	   'tab': {
            	      value: '0',
            	      squash: true
            	   }
            	},
            controller: 'DetailController',
            controllerAs: 'vm'
        })
        .state('person.map', {
            url: '/kartat',
            templateUrl: 'views/person/map.html',
            controller: 'MapController',
            controllerAs: 'vm'
        })
        .state('person.network', {
            url: '/verkosto?coloroption&sizeoption',
            params: {
            	coloroption: {
         	      value: '0',
         	      squash: true
         	   },
         	    sizeoption: {
         	      value: '0',
         	      squash: true
         	   }
         	},
            templateUrl: 'views/person/network.html',
            controller: 'PersonNetworkController',
            controllerAs: 'vm'
        })
        .state('person.sentence', {
            url: '/lauseet',
            templateUrl: 'views/person/sentences.html',
            controller: 'PersonSentencesController',
            controllerAs: 'vm'
        })
	.state('person.linguistics', {
            url: '/kielianalyysi',
            templateUrl: 'views/person/linguistics.html',
            controller: 'PersonLinguisticsController',
            controllerAs: 'vm'
        })
        .state('place', { 
            url: '/paikka/:placeId',
            templateUrl: 'views/place.html',
            controller: 'PlaceController',
            controllerAs: 'vm'
        }) /*
        .state('title', { //	page not implemented
            url: '/title/:titleId',
            templateUrl: 'views/title.html',
            controller: 'TitleController',
            controllerAs: 'vm'
        }) */
        .state('search', {
            url: '/haku',
            // abstract: true,
            templateUrl: 'views/search/tabs.html'
        })
        .state('search.table', {
            url: '/lista',
            templateUrl: 'views/search/table.html',
            controller: 'TableController',
            controllerAs: 'vm'
        })
        .state('search.cards', {
            url: '/ruudukko',
            templateUrl: 'views/search/cards.html',
            controller: 'CardsController',
            controllerAs: 'vm',
        })

        .state('maps', {
            url: '/kartat',
            // abstract: true,
            templateUrl: 'views/groupmap/tabs.html'
        })
        .state('maps.singleview', {
            url: '/tapahtumat',
            templateUrl: 'views/groupmap/singleview.html',
            controller: 'GroupmapController',
            controllerAs: 'vm',
        })
        .state('maps.comparison', {
            url: '/vertaatapahtumat',
            abstract: true,
            templateUrl: 'views/comparison.html',
        })
        .state('maps.comparison.sides', {
            url: '',
            views: {
                'left@maps.comparison': {
                    templateUrl: 'views/groupmap/comparison.left.html',
                    controller: 'GroupmapController',
                    controllerAs: 'vm',
                },
                'right@maps.comparison': {
                    templateUrl: 'views/groupmap/comparison.right.html',
                    controller: 'GroupmapControllerRight',
                    controllerAs: 'vm',
                }
            }
        })
        .state('maps.singleview2', {
            url: '/elamat',
            templateUrl: 'views/groupmap/singleview2.html',
            controller: 'LifemapController',
            controllerAs: 'vm',
        })
        .state('maps.comparison2', {
            url: '/vertaaelamat',
            abstract: true,
            templateUrl: 'views/comparison.html',
        })
        .state('maps.comparison2.sides', {
            url: '', 
            views: {
                'left@maps.comparison2': {
                    templateUrl: 'views/groupmap/comparison2.left.html',
                    controller: 'LifemapController',
                    controllerAs: 'vm',
                },
                'right@maps.comparison2': {
                    templateUrl: 'views/groupmap/comparison2.right.html',
                    controller: 'LifemapControllerRight',
                    controllerAs: 'vm',
                }
            }
        })
        .state('relativenetwork', {
            url: '/sukulaisuudet',
            templateUrl: 'views/network/relativeNetwork.html',
            controller: 'NetworkRelativeController',
            controllerAs: 'vm'
        })
        .state('network', {
            url: '',
            templateUrl: 'views/network/tabs.html'
        })
        .state('network.net', {
            url: '/verkosto',
            templateUrl: 'views/network/network.html',
            controller: 'NetworkController',
            controllerAs: 'vm'
        })
        .state('network.pointcloud', {
            url: '/pistepilvi',
            templateUrl: 'views/network/pointcloud.html',
            controller: 'PointcloudController',
            controllerAs: 'vm'
        })
        .state('nlp', {
            url: '/kielianalyysi',
            abstract: true,
            templateUrl: 'views/nlp/tabs.html',
            controller: 'NlpStatisticsController',
            controllerAs: 'vm',
        })
        .state('nlp.statistics', {
            url: '?facets',
	    params: {
                facets: {
		    value: '{"dataset":{"value":"<http://ldf.fi/nbf/sources/source4>","constraint":"?id <http://purl.org/dc/terms/source> <http://ldf.fi/nbf/sources/source4>."}}'
		}
            },

            templateUrl: 'views/nlp/statistics.html',
            controller: 'NlpStatisticsController',
            controllerAs: 'vm',
        })
        .state('nlp.comparison', {
	    url: '',
            abstract: true,
            templateUrl: 'views/nlp/comparison.html',
        })
        .state('nlp.comparison.sides', {
            url: '/vertaa?facets&facets2',
	    params: {
        	facets: null,
        	facets2: null
            },
            views: {
                'left@nlp.comparison': {
	            templateUrl: 'views/nlp/comparison.left.html',
                    controller: 'NlpComparisonController',
                    controllerAs: 'vm',
                },
                'right@nlp.comparison': {
                    templateUrl: 'views/nlp/comparison.right.html',
                    controller: 'NlpComparisonControllerRight',
                    controllerAs: 'vm',
                },
		// For example query buttons on top of the page
		'buttons@nlp.comparison': {
                   templateUrl: 'views/description.npl.comparison.partial.html',
                   controller: 'NlpComparisonController',
                   controllerAs: 'vm'
               }
            }
        })

        .state('visu', {
            url: '/tilastot',
            // abstract: true,
            templateUrl: 'views/visu/tabs.html'
        })
        .state('visu.statistics', {
            url: '/palkit',
            templateUrl: 'views/visu/statistics.html',
            controller: 'VisuColumnController',
            controllerAs: 'vm',
        })
        .state('visu.comparison', {
            url: '/vertaapalkit',
            abstract: true,
            templateUrl: 'views/comparison.html',
        })
        .state('visu.comparison.sides', {
            url: '',
            views: {
                'left@visu.comparison': {
                    templateUrl: 'views/visu/comparison.left.html',
                    controller: 'VisuColumnController',
                    controllerAs: 'vm'
                },
                'right@visu.comparison': {
                    templateUrl: 'views/visu/comparison.right.html',
                    controller: 'VisuColumnControllerRight',
                    controllerAs: 'vm'
                }
            }
        })
        .state('visu2', {
            url: '/tilastot2',
            abstract: true,
            templateUrl: 'views/visu2/visu.html',
        })
        .state('visu.statistics2', {
            url: '/piiraat',
            templateUrl: 'views/visu2/statistics.html',
            controller: 'VisuPieController',
            controllerAs: 'vm',
        })
        .state('visu.comparison2', {
            url: '/vertaapiiraat',
            abstract: true,
            templateUrl: 'views/comparison.html',
        })
        .state('visu.comparison2.sides', {
            url: '',
            views: {
                'left@visu.comparison2': {
                    templateUrl: 'views/visu2/comparison.left.html',
                    controller: 'VisuPieController',
                    controllerAs: 'vm',
                },
                'right@visu.comparison2': {
                    templateUrl: 'views/visu2/comparison.right.html',
                    controller: 'VisuPieControllerRight',
                    controllerAs: 'vm',
                }
            }
        })
        .state('testing', {
            url: '/testing',
            templateUrl: 'views/testing.html',
            controller: 'CardsController',
            controllerAs: 'vm'
        })
        .state('feedback', {
            url: '/palaute',
            templateUrl: 'views/palaute.html'
        })
        ;
    });
})();
