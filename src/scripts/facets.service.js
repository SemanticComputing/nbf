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
                /** TODO doesn't show data from graph <people_protected>
                 */
                name: 'Haku nimen perusteella',
                enabled: true
            },
            dataset: {
                facetId: 'dataset',
                predicate: '<http://purl.org/dc/terms/source> ',
                name: 'Tietokanta',
                chart: true,
                enabled: true /*,
                classes: [
                    '<http://ldf.fi/nbf/sources/source1>',
                    '<http://ldf.fi/nbf/sources/source2>',
                    '<http://ldf.fi/nbf/sources/source3>',
                    '<http://ldf.fi/nbf/sources/source4>',
                    '<http://ldf.fi/nbf/sources/source5>' ] */
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
                    }, /*
                    {
                        id: 'kulttuurisampo',
                        pattern: '?id <http://ldf.fi/nbf/kulsa> [] . ',
                        label: 'Kulttuurisampo'
                    }, */
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
                        label: 'Ylioppilasmatrikkeli'
                    }
                ],
                chart: true,
                enabled: true,
                name: 'Linkitetyt tietokannat'
            },
            period: {
                facetId: 'period',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_period>/<http://www.w3.org/2004/02/skos/core#prefLabel>',
                name: 'Ajanjakso',
                chart: true,
                enabled: true
            },
            familyName: {
                facetId: 'familyName',
                predicate: '<http://www.w3.org/2008/05/skos-xl#prefLabel>/<http://schema.org/familyName>',
                chart: true,
                name: 'Sukunimi'
            },
            author: {
                facetId: 'author',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography>/<http://schema.org/author>',
                chart: true,
                name: 'Kirjoittaja'
            },
            place: {
                facetId: 'place',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/(^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>)/<http://ldf.fi/nbf/place>/<http://www.w3.org/2004/02/skos/core#prefLabel>',
                name: 'Synnyinpaikka',
                hierarchy: '<http://www.w3.org/2004/02/skos/core#broader>',
                depth: 5, 
                enabled: true
            },
            title: {
                facetId: 'title',
                //	nb do not remove /<http://www.w3.org/2004/02/skos/core#prefLabel> from the end of property path
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/schema/bioc/has_profession>/<http://www.w3.org/2004/02/skos/core#broader>?/<http://www.w3.org/2004/02/skos/core#prefLabel>',
                name: 'Arvo, ammatti tai toiminta',
                chart: true,
                enabled: true
            },
            company: {
                facetId: 'company',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://ldf.fi/schema/bioc/inheres_in>/<http://ldf.fi/nbf/related_company>',
                name: 'Yritys tai yhteisö',
                chart: true,
                enabled: true
            },
            category: {
                facetId: 'category',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_category>',
                name: 'Toimiala',
                chart: true,
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
            constraint: '?id <http://www.w3.org/2008/05/skos-xl#prefLabel>/<http://www.w3.org/2004/02/skos/core#prefLabel> ?familyName ; <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] . OPTIONAL { ?id <http://ldf.fi/nbf/ordinal> ?ordinal } ',
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
