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
        'uiGmapgoogle-maps'
    ])
    
    .constant('_', _) // eslint-disable-line no-undef
    .constant('RESULTS_PER_PAGE', 25)
    .constant('PAGES_PER_QUERY', 1)

    .value('SPARQL_ENDPOINT_URL', 'http://ldf.fi/nbf/sparql')

    .config(function($urlMatcherFactoryProvider) {
        $urlMatcherFactoryProvider.strictMode(false);
    })

    .config(function($urlRouterProvider, $windowProvider){
        $urlRouterProvider.when('', '/ruudukko');
        $urlRouterProvider.otherwise(function() {
            $windowProvider.$get().location = 'http://www.norssit.fi';
        });
    })

    .config(function($stateProvider) {
        $stateProvider
        .state('detail', {
            url: '/tiedot/:personId',
            templateUrl: 'views/detail.html',
            controller: 'DetailController',
            controllerAs: 'vm'
        })
        .state('map', {
            url: '/kartta/:personId',
            templateUrl: 'views/map.html',
            controller: 'MapController',
            controllerAs: 'vm'
        })
        .state('table', {
            url: '/lista',
            templateUrl: 'views/table.html',
            controller: 'TableController',
            controllerAs: 'vm'
        })
        .state('cards', {
            url: '/ruudukko',
            templateUrl: 'views/cards.html',
            controller: 'CardsController',
            controllerAs: 'vm'
        })
        .state('visualizations', {
            abstract: true
        })
        .state('visualizations.visu', {
            url: '/visualisointi',
            templateUrl: 'views/visu.html',
            controller: 'VisuController',
            controllerAs: 'vm'
        })
        .state('visualizations.visu2', {
            url: '/visualisointi2',
            templateUrl: 'views/visu2.html',
            controller: 'VisuController2',
            controllerAs: 'vm'
        });
    });
})();
