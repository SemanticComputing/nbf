(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('mapfacetService', mapfacetService);

    /* @ngInject */
    function mapfacetService($q, SPARQL_ENDPOINT_URL) {

        /* Public API */

        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;
        // Update sorting URL params.

        /* Implementation */

        var facets = {
                dataset: {
                    facetId: 'dataset',
                    predicate: '<http://purl.org/dc/terms/source>',
                    name: 'Tietokanta',
                    enabled: true
                },
                slider: {
                    facetId: 'slider',
                    name: 'Rajaa henkilöiden syntymäaika',
                    predicate: ('<http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>/' +
                        '<http://ldf.fi/nbf/time>/<http://vocab.getty.edu/ontology#estStart>'),
                    enabled: true
                },
                link: {
                    facetId: 'link',
                    choices: [
                        {
                            id: 'wikipedia',
                            pattern: '?id <http://ldf.fi/nbf/wikipedia> [] .',
                            label: 'Wikipedia'
                        },
                        {
                            id: 'wikidata',
                            pattern: '?id <http://ldf.fi/nbf/wikidata> [] .',
                            label: 'Wikidata'
                        },
                        {
                            id: 'fennica',
                            pattern: '?id <http://ldf.fi/nbf/fennica> [] .',
                            label: 'Fennica - Suomen kansallisbibliografia'
                        },
                        {
                            id: 'sotasampo',
                            pattern: '?id <http://ldf.fi/nbf/warsampo> [] .',
                            label: 'Sotasampo'
                        },
                        {
                            id: 'norssit',
                            pattern: '?id <http://ldf.fi/nbf/norssi> [] .',
                            label: 'Norssit'
                        },
                        {
                            id: 'kirjasampo',
                            pattern: '?id <http://ldf.fi/nbf/kirjasampo> [] . ',
                            label: 'Kirjasampo'
                        },
                        {
                            id: 'blf',
                            pattern: '?id <http://ldf.fi/nbf/blf> [] .',
                            label: 'Biografiskt lexikon för Finland'
                        },
                        {
                            id: 'ulan',
                            pattern: '?id <http://ldf.fi/nbf/ulan> [] .',
                            label: 'ULAN'
                        },
                        {
                            id: 'viaf',
                            pattern: '?id <http://ldf.fi/nbf/viaf> [] .',
                            label: 'VIAF'
                        },
                        {
                            id: 'genicom',
                            pattern: '?id <http://ldf.fi/nbf/genicom> [] .',
                            label: 'Geni.com'
                        },
                        {
                            id: 'website',
                            pattern: '?id <http://ldf.fi/nbf/website> [] .',
                            label: 'Kotisivu'
                        },
                        {
                            id: 'eduskunta',
                            pattern: '?id <http://ldf.fi/nbf/eduskunta> [] .',
                            label: 'Eduskunta'
                        },
                        {
                            id: 'yoma',
                            pattern: '?id <http://ldf.fi/nbf/yoma> [] .',
                            label: 'Ylioppilasmatrikkeli 1640–1899'
                        }
                    ],
                    enabled: true,
                    chart: true,
                    name: 'Linkitetyt tietokannat'
                },
                period: {
                    facetId: 'period',
                    predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_period>/<http://www.w3.org/2004/02/skos/core#prefLabel>',
                    name: 'Ajanjakso',
                    enabled: true
                },
                author: {
                    facetId: 'author',
                    predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography>/<http://schema.org/author>',
                    name: 'Kirjoittaja'
                },
                birthYear: {
                    facetId: 'birthYear',
                    predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>/<http://ldf.fi/nbf/time>',
                    name: 'Synnyinaika',
                    enabled: true
                },
                place: {
                    facetId: 'place',
                    predicate: '<http://xmlns.com/foaf/0.1/focus>/(^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>)/<http://ldf.fi/nbf/place>/<http://www.w3.org/2004/02/skos/core#prefLabel>',
                    //predicate: '<http://xmlns.com/foaf/0.1/focus>/(^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>|^<http://www.cidoc-crm.org/cidoc-crm/P100_was_death_of>)/<http://ldf.fi/nbf/place>',
                    name: 'Syntymäpaikka',
                    hierarchy: '<http://www.w3.org/2004/02/skos/core#broader>',
                    depth: 5, 
                    enabled: false
                },
                deathplace: {
                    facetId: 'deathplace',
                    predicate: '<http://xmlns.com/foaf/0.1/focus>/(^<http://www.cidoc-crm.org/cidoc-crm/P100_was_death_of>)/<http://ldf.fi/nbf/place>',
                    name: 'Kuolinpaikka',
                    hierarchy: '<http://www.w3.org/2004/02/skos/core#broader>',
                    depth: 5, 
                    enabled: false
                },
                deathYear: {
                    facetId: 'birthYear',
                    predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P100_was_death_of>/<http://ldf.fi/nbf/time>',
                    name: 'Kuolinaika',
                    enabled: true
                },
                title: {
                    facetId: 'title',
                    predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://ldf.fi/schema/bioc/inheres_in>/<http://ldf.fi/nbf/has_title>/<http://www.w3.org/2004/02/skos/core#prefLabel>',
                    name: 'Arvo, ammatti tai toiminta',
                    chart: true,
                    enabled: true
                },
                company: {
                    facetId: 'company',
                    predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://ldf.fi/schema/bioc/inheres_in>/<http://ldf.fi/nbf/related_company>/<http://www.w3.org/2004/02/skos/core#prefLabel>',
                    name: 'Yritys tai yhteisö',
                    enabled: true
                },
                category: {
                    facetId: 'category',
                    predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_category>/<http://www.w3.org/2004/02/skos/core#prefLabel>',
                    name: 'Toimiala',
                    enabled: true
                },
                gender: {
                    facetId: 'gender',
                    predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/sukupuoli>',
                    name: 'Sukupuoli tai ryhmä',
                    chart: true,
                    enabled: true
                },
                keywords: {
                    facetId: 'keywords',
                    predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography>/<http://purl.org/dc/elements/1.1/subject>',
                    name: 'Avainsanat',
                    chart: true,
                    enabled: true
                }
            };

            
        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };

        var facetOptions = {
            endpointUrl: endpointConfig.endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/PersonConcept>',
            preferredLang : 'fi',
            noSelectionString: '-- Ei valintaa --'
        };


        function getFacets() {
            var facetsCopy = angular.copy(facets);
            return $q.when(facetsCopy);
        }

        function getFacetOptions() {
            return angular.copy(facetOptions);
        }
    }
})();
