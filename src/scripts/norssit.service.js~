(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('norssitService', norssitService);

    /* @ngInject */
    function norssitService($q, _, FacetResultHandler) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;

        /* Implementation */

        var facets = {
            // Text search facet for name
            entryText: {
                facetId: 'entryText',
                predicate: '<http://ldf.fi/schema/person_registry/entryText>',
                name: 'Haku',
                enabled: true
            },
            link: {
                facetId: 'link',
                choices: [
                    {
                        id: 'wikipedia',
                        pattern: '?id <http://ldf.fi/norssit/wikipedia> [] .',
                        label: 'Wikipedia'
                    },
                    {
                        id: 'kansallisbiografia',
                        pattern: '?id <http://ldf.fi/norssit/kansallisbiografia> [] .',
                        label: 'Kansallisbiografia'
                    },
                    {
                        id: 'kirjasampo',
                        pattern: '?id <http://ldf.fi/norssit/kirjasampo> [] .',
                        label: 'Kirjasampo'
                    },
                    {
                        id: 'kulttuurisampo',
                        pattern: '?id <http://ldf.fi/norssit/kulttuurisampo> [] .',
                        label: 'Kulttuurisampo'
                    },
                    {
                        id: 'sotasampo',
                        pattern: '?id <http://ldf.fi/norssit/warsa> [] .',
                        label: 'Sotasampo'
                    },
                    {
                        id: 'blf',
                        pattern: '?id <http://ldf.fi/norssit/sls_biografi> [] .',
                        label: 'BLF'
                    },
                    {
                        id: 'wikidata',
                        pattern: '?id <http://ldf.fi/norssit/wikidata> [] .',
                        label: 'Wikidata'
                    },
                    {
                        id: 'ulan',
                        pattern: '?id <http://ldf.fi/norssit/ulan> [] .',
                        label: 'ULAN'
                    },
                    {
                        id: 'viaf',
                        pattern: '?id <http://ldf.fi/norssit/viaf> [] .',
                        label: 'VIAF'
                    },
                    {
                        id: 'genicom',
                        pattern: '?id <http://ldf.fi/norssit/genicom> [] .',
                        label: 'Geni.com'
                    }
                ],
                enabled: true,
                name: 'Linkit'
            },
            familyName: {
                facetId: 'familyName',
                predicate: '<http://schema.org/familyName>',
                name: 'Sukunimi'
            },
            birthPlace: {
                facetId: 'birthPlace',
                predicate: '<http://ldf.fi/schema/person_registry/birthPlace>',
                name: 'Syntymäpaikka',
                enabled: true
            },
            enrollmentYear: {
                facetId: 'enrollmentYear',
                predicate: '<http://ldf.fi/schema/person_registry/enrollmentYear>',
                name: 'Aloittamisvuosi',
                enabled: true
            },
            matriculationYear: {
                facetId: 'matriculationYear',
                predicate: '<http://ldf.fi/schema/person_registry/matriculationYear>',
                name: 'Valmistumisvuosi',
                enabled: true
            },
            occupation: {
                facetId: 'occupation',
                predicate: '^<http://ldf.fi/schema/bioc/title_inheres_in>/a',
                name: 'Arvo tai ammatti',
                enabled: true
            },
            organization: {
                facetId: 'organization',
                predicate: '^<http://ldf.fi/schema/bioc/title_inheres_in>/<http://ldf.fi/schema/bioc/relates_to>',
                name: 'Työpaikka tai oppilaitos',
                enabled: true
            },hobby: {
                facetId: 'hobby',
                predicate: '<http://schema.org/hobby>',
                name: 'Harrastus'
            }
        };

        var prefixes =
        ' PREFIX hobbies: <http://ldf.fi/hobbies/> ' +
        ' PREFIX norssit: <http://ldf.fi/norssit/> ' +
        ' PREFIX nach: <http://ldf.fi/norssit/achievements/> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX person_registry: <http://ldf.fi/schema/person_registry/> ' +
        ' PREFIX places: <http://ldf.fi/places/> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX relatives: <http://ldf.fi/relatives/> ' +
        ' PREFIX schema: <http://schema.org/> ' +
        ' PREFIX schemax: <http://topbraid.org/schemax/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ' +
        ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ';

        // The query for the results.
        // ?id is bound to the norssit URI.
        var query =
        ' SELECT DISTINCT * WHERE {' +
        '  { ' +
        '    <RESULT_SET> ' +
        '  } ' +
        '  OPTIONAL { ?id schema:givenName ?givenName . }' +
        '  OPTIONAL { ?id schema:familyName ?familyName . }' +
        '  OPTIONAL { ?id person_registry:birthPlace ?birthPlace . } ' +
        '  OPTIONAL { ?id norssit:ordinal ?ordinal . } ' +
        '  OPTIONAL { ?id schema:birthDate ?birthDate . }' +
        '  OPTIONAL { ?id schema:deathDate ?deathDate . }' +
        '  OPTIONAL { ' +
        '   ?id schema:hobby ?hobby_id . ' +
        '   BIND(REPLACE(STR(?hobby_id), "http://ldf.fi/hobbies/", "") AS ?hobby) ' +
        '  }' +
        '  OPTIONAL { ?id schema:image ?image . }' +
        '  OPTIONAL { ?id dct:description ?description . }' +
        '  OPTIONAL { ?id person_registry:pageNumber ?pageNumber . }' +
        '  OPTIONAL { ?id person_registry:pageImageURL ?pageImageURL . }' +
        '  OPTIONAL { ?id person_registry:relatedNorssi ?relatedNorssi . }' +
        '  OPTIONAL { ?id person_registry:enrollmentYear ?enrollmentYear . }' +
        '  OPTIONAL { ?id person_registry:matriculationYear ?matriculationYear . }' +
        '  OPTIONAL { ?id person_registry:entryText ?entryText . }' +
        '  OPTIONAL { ?id norssit:wikipedia ?wikipedia . }' +
        '  OPTIONAL { ?id norssit:viaf ?viaf . }' +
        '  OPTIONAL { ?id norssit:kansallisbiografia ?kansallisbiografia . }' +
        '  OPTIONAL { ?id norssit:wikidata ?wikidata . }' +
        '  OPTIONAL { ?id norssit:ulan ?ulan . }' +
        '  OPTIONAL { ?id norssit:warsa ?warsa . }' +
        '  OPTIONAL { ?id norssit:kirjasampo ?kirjasampo . }' +
        '  OPTIONAL { ?id norssit:kulttuurisampo ?kulttuurisampo . }' +
        '  OPTIONAL { ?id norssit:kb ?kb . }' +
        '  OPTIONAL { ?id norssit:genitree ?genitree . }' +
        '  OPTIONAL { ?id norssit:genicom ?genicom . }' +
        '  OPTIONAL { ?id norssit:sls_biografi ?blf . }' +
        '  OPTIONAL { ' +
        '  	?id bioc:has_family_relation [' +
        '    	bioc:inheres_in ?relative__id ;' +
        '      	a/skos:prefLabel ?relative__type ] .' +
        '    	FILTER (LANG(?relative__type)="fi")' +
        '    	?relative__id schema:familyName ?relative__familyName ; schema:givenName ?relative__givenName .' +
        '		BIND (replace(concat(?relative__givenName," ",?relative__familyName),"[(][^)]+[)]\s*","") AS ?relative__name) ' +
        '  }' +
        '  OPTIONAL { ' +
        '    ?ach rdfs:subPropertyOf* nach:involved_in .' +
        '    ?id ?ach ?achievement__id . ' +
        '    ?achievement__id skos:prefLabel ?achievement__label .' +
        '    ?achievement__id norssit:wikipedia|norssit:www ?achievement__wikipedia .' +
        '  }' +
        ' }';

        // The SPARQL endpoint URL
        var endpointUrl = 'https://ldf.fi/norssit/sparql';

        var facetOptions = {
            endpointUrl: endpointUrl,
            rdfClass: '<http://xmlns.com/foaf/0.1/Person>',
            constraint: '?id <http://ldf.fi/norssit/ordinal> ?ordinal .',
            preferredLang : 'fi'
        };

        var resultOptions = {
            queryTemplate: query,
            prefixes: prefixes,
            pagesPerQuery: 2 // get two pages of results per query
        };

        // The FacetResultHandler handles forming the final queries for results,
        // querying the endpoint, and mapping the results to objects.
        var resultHandler = new FacetResultHandler(endpointUrl, resultOptions);

        function getResults(facetSelections) {
            // Get the results sorted by ?name.
            // Any variable declared in facetOptions.constraint can be used in the sorting,
            // and any valid SPARQL ORDER BY sequence can be given.
            // The results are sorted by URI by default.
            return resultHandler.getResults(facetSelections, '?ordinal ?id');
        }

        function getFacets() {
            // Translate the facet headers.
            var facetsCopy = angular.copy(facets);
            return $q.when(facetsCopy);
        }

        function getFacetOptions() {
            return facetOptions;
        }
    }
})();
