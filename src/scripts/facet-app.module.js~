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
        'infinite-scroll'
    ])

    .constant('_', _) // eslint-disable-line no-undef
    .constant('RESULTS_PER_PAGE', 25)
    .constant('PAGES_PER_QUERY', 1)

    .config(function($urlMatcherFactoryProvider) {
        $urlMatcherFactoryProvider.strictMode(false);
    })

    .config(function($urlRouterProvider){
        $urlRouterProvider.otherwise('/lista');
    })

    .config(function($stateProvider) {
        $stateProvider
        .state('table', {
            url: '/taulukko',
            templateUrl: 'views/norssit.table.html',
            controller: 'TableController',
            controllerAs: 'vm'
        })
        .state('list', {
            url: '/lista',
            templateUrl: 'views/norssit.list.html',
            controller: 'CardsController',
            controllerAs: 'vm'
        })
        .state('visu', {
            url: '/visualisointi',
            templateUrl: 'views/norssit.visu.html',
            controller: 'VisuController',
            controllerAs: 'vm'
        });
    });
})();
