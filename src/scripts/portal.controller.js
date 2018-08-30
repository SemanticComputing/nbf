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
                /*
                photographsH: "Valokuvat",
                photographsP: "SA-kuva-arkiston valokuvien selaus fasettihaun avulla",
                cemeteriesH: "Sankarihautausmaat",
                cemeteriesP: "Suomen sankarihautausmaat valokuvin",
                examples: "Esimerkkisivuja",
                personExH: "Henkilö",
                personExP: "Kenraalimajuri Einar Vihma",
                unitExH: "Joukko-osasto",
                unitExP: "Lentolaivue 32",
                eventExH: "Tapahtuma",
                eventExP: "Taistelut alkoivat",
                photoExH: "Valokuva",
                photoExP: "Viipurin valtausparaati",
                imgCopyRightP: "Kuvat:",
                imgCopyRight: "SA-kuva",
                */
                metaDescription: "Sovelluksen avulla voi hakea, selata, visualisoida ja tutkia laajoja suomalaisiin historiallisiin henkilöihin liittyviä tietoaineistoja."
            };
        /*
        var englishStrings = {
                pageTitle: "WarSampo",
                jumboTitle: "WarSampo",
                jumboSubtitle: "Finnish World War II on the Semantic Web",
                generalDesc: "The WarSampo Portal enables both historians and laymen to study the war history and destinies of their family members in the war from different interlinked perspectives",
                followFacebook: "Join the WarSampo Facebook group",
                ins: "instructions",
                localeLinkText: "Suomeksi",
                choosePerspective : "Select a perspective to search and browse the WarSampo data",
                perspectiveTooltip: "Click to open the perspective",
                searchH: "Events",
                searchP: "Events of the Winter and Continuation War visualized using a timeline and a map with related linked data",
                mapsH: "maps",
                mapsP: "Data about maps with related links from various sources",
                statisticsH: "Army statistics",
                statisticsP: "Events and other related data about army statistics visualized using i.a. maps",
                networksH: "networks",
                networksP: "Search and browse networks and maps covering the war zone area in Finland and discover addional data such as events and photographs linked to places",
                relationsH: "Kansa taisteli magazine relations",
                relationsP: "Faceted semantic search and contextual reader for Kansa taisteli magazine relations containing mostly memoirs of soldiers related to WW2",
                casultiesH: "language",
                casultiesP: "A table-like view of war casualty records that can be filtered using faceted semantic search, enriched with links to other WarSampo datasets ",
                photographsH: "Photographs",
                photographsP: "Browse the content of the Finnish Wartime Photograph Archive with faceted search",
                cemeteriesH: "War Cemeteries",
                cemeteriesP: "War cemeteries of Finland with photographs",
                examples: "Example Pages",
                personExH: "Person",
                personExP: "Major General Einar Vihma",
                unitExH: "Army Unit",
                unitExP: "No. 32 Squadron",
                eventExH: "Event",
                eventExP: "Battles commenced",
                photoExH: "Photograph",
                photoExP: "Military parade celebrating the capture of Vyborg",
                imgCopyRightP: "Photos:",
                imgCopyRight: "Finnish Wartime Photograph Archive",
                metaDescription: "WarSampo lets you search, browse, and visualize large datasets regarding the Winter War, Continuation War, and Lapland War."
            };
        */
        
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