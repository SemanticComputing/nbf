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

    .config(function($urlRouterProvider){
        $urlRouterProvider.when('', '/ruudukko');
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

    .config(function($stateProvider) {
        $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'views/login.html',
            controller: 'LoginController',
            controllerAs: 'vm'
        })
        .state('person', {
            abstract: true,
            url: '/:personId',
            templateUrl: 'views/person.html'
        })
        .state('person.detail', {
            url: '',
            templateUrl: 'views/detail.html',
            controller: 'DetailController',
            controllerAs: 'vm'
        })
        .state('person.map', {
            url: '/kartta',
            templateUrl: 'views/map.html',
            controller: 'MapController',
            controllerAs: 'vm'
        })
        .state('place', {
            url: '/place/:placeId',
            templateUrl: 'views/place.html',
            controller: 'PlaceController',
            controllerAs: 'vm'
        })
        .state('title', {
            url: '/title/:titleId',
            templateUrl: 'views/title.html',
            controller: 'TitleController',
            controllerAs: 'vm'
        })
        .state('table', {
            url: '/lista',
            templateUrl: 'views/table.html',
            controller: 'TableController',
            controllerAs: 'vm'
        })
        .state('groupmap', {
            url: '/joukkokartta',
            templateUrl: 'views/groupmap.html',
            controller: 'GroupmapController',
            controllerAs: 'vm',
        })
        .state('network', {
            url: '/verkosto',
            templateUrl: 'views/network.html',
            controller: 'NetworkController',
            controllerAs: 'vm',
        })
        .state('cards', {
            url: '/ruudukko',
            templateUrl: 'views/cards.html',
            controller: 'CardsController',
            controllerAs: 'vm',
        })
        .state('nlp', {
            url: '/nlp',
            abstract: true,
            templateUrl: 'views/nlp.html',
        })
        .state('nlp.statistics', {
            url: '',
            templateUrl: 'views/nlp.statistics.html',
            controller: 'NlpStatisticsController',
            controllerAs: 'vm',
        })
        .state('nlp.comparison', {
            url: '/vertaa',
            abstract: true,
            templateUrl: 'views/nlp.comparison.html',
        })
        .state('nlp.comparison.sides', {
            url: '',
            views: {
                'left@nlp.comparison': {
                    templateUrl: 'views/nlp.comparison.left.html',
                    controller: 'NlpComparisonController',
                    controllerAs: 'vm',
                },
                'right@nlp.comparison': {
                    templateUrl: 'views/nlp.comparison.right.html',
                    controller: 'NlpComparisonController',
                    controllerAs: 'vm',
                }
            }
        })
        .state('visu', {
            url: '/visu',
            abstract: true,
            templateUrl: 'views/visu.html',
        })
        .state('visu.statistics', {
            url: '',
            templateUrl: 'views/visu.statistics.html',
            controller: 'VisuController',
            controllerAs: 'vm',
        })
        .state('visu.comparison', {
            url: '/vertaa',
            abstract: true,
            templateUrl: 'views/visu.comparison.html',
        })
        .state('visu.comparison.sides', {
            url: '',
            views: {
                'left@visu.comparison': {
                    templateUrl: 'views/visu.comparison.left.html',
                    controller: 'VisuController',
                    controllerAs: 'vm',
                },
                'right@visu.comparison': {
                    templateUrl: 'views/visu.comparison.right.html',
                    controller: 'VisuController2',
                    controllerAs: 'vm',
                }
            }
        });
    });
})();
