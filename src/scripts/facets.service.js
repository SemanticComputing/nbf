(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('facetService', facetService);

    /* @ngInject */
    function facetService($q, SPARQL_ENDPOINT_URL) {

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
            entryText: {
                facetId: 'entryText',
                graph: '<http://ldf.fi/nbf/people>',
                name: 'Haku',
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
                        label: 'BLF'
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
                    }
                ],
                enabled: true,
                name: 'Linkit'
            },
            period: {
                facetId: 'period',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_period>/<http://www.w3.org/2004/02/skos/core#prefLabel>',
                name: 'Ajanjakso',
                enabled: true
            },
            familyName: {
                facetId: 'familyName',
                predicate: '<http://www.w3.org/2008/05/skos-xl#prefLabel>/<http://schema.org/familyName>',
                name: 'Sukunimi'
            },
            dataset: {
                facetId: 'dataset',
                predicate: '<http://purl.org/dc/terms/source>',
                name: 'Tietokanta'
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
                predicate: '<http://xmlns.com/foaf/0.1/focus>/(^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>|^<http://www.cidoc-crm.org/cidoc-crm/P100_was_death_of>)/<http://ldf.fi/nbf/place>/<http://www.w3.org/2004/02/skos/core#prefLabel>',
                name: 'Paikkakunta',
                enabled: true
            },
            deathYear: {
                facetId: 'birthYear',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P100_was_death_of>/<http://ldf.fi/nbf/time>',
                name: 'Kuolinaika',
                enabled: true
            },
            title: {
                facetId: 'title',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://ldf.fi/schema/bioc/inheres_in>/<http://ldf.fi/nbf/has_title>',
                name: 'Arvo, ammatti tai toiminta',
                hierarchy: '<http://www.w3.org/2004/02/skos/core#broader>',
                depth: 3,
                enabled: true
            },
            company: {
                facetId: 'company',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://ldf.fi/schema/bioc/inheres_in>/<http://ldf.fi/nbf/related_company>',
                name: 'Yritys tai yhteisö',
                enabled: true
            },
            category: {
                facetId: 'category',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_category>',
                name: 'Kategoria',
                enabled: true
            },
            gender: {
                facetId: 'gender',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/sukupuoli>',
                name: 'Sukupuoli',
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
            constraint: '?id <http://www.w3.org/2008/05/skos-xl#prefLabel>/<http://schema.org/familyName> ?familyName . ?id <http://ldf.fi/nbf/ordinal> ?ordinal . ',
            preferredLang : 'fi',
            noSelectionString: '-- Ei valintaa --'
        };


        function getFacets() {
            var facetsCopy = angular.copy(facets);
            return $q.when(facetsCopy);
        }

        function getFacetOptions() {
            return facetOptions;
        }
    }
})();