(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('PortalController', PortalController);

    /* @ngInject */
    function PortalController($stateParams, $uibModal, _, nbfService, $sce) {
    	
        var vm = this;
        
        var finnishStrings = {
                pageTitle: "Semanttinen kansallisbiografia",
                jumboTitle: "Semanttinen kansallisbiografia",
                jumboSubtitle: "Suomalaisten elämäkertojen verkosto semanttisessa webissä",
                generalDesc: "Sovellus mahdollistaa suomalaisten historiallisten henkilöiden elämäkertojen ja henkilöryhmien tutkimisen " +
                		"toisiinsa linkitettyjen laajojen tietoaineistojen avulla.",
                ins: "ohje",
                followFacebook: "Liity Semanttinen kansallisbiografia -ryhmään Facebookissa",
                localeLinkText: "In English",
                choosePerspective: "Valitse sovellusnäkymä aineistoihin",
                perspectiveTooltip: "Klikkaa käynnistääksesi sovellus",
                searchH: "Hae ja selaa",
                searchP: "Etsi elämäkertoja joustavasti eri näkökulmista",
                mapsH: "Kartat",
                mapsP: "Elämäkerrat kartalla",
                statisticsH: "Tilastot",
                statisticsP: "Ryhmien elämäntarinat tilastojen kautta",
                networksH: "Verkostot",
                networksP: "Tutki historiallisten henkilöiden verkostoja",
                relationsH: "Yhteyshaku",
                relationsP: "Hae henkilöiden ja paikkojen välisisä yhteyksiä",
                casultiesH: "Kielianalyysi",
                casultiesP: "Tutki elämäkerroissa käytetttyä kieltä",
                
                metaDescription: "Sovelluksen avulla voi hakea, selata, visualisoida ja tutkia laajoja suomalaisiin historiallisiin henkilöihin liittyviä tietoaineistoja."
            };
        
        vm.strings = finnishStrings;
        vm.testing = "Testing";
        
        init();
        
        function init() {
            nbfService.getPortal().then(function(test) {
                return test;
            }).catch(handleError);
        }
        
        function openPage() {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return vm.person; }
                }
            });
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
