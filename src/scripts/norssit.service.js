(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('norssitService', norssitService);

    /* @ngInject */
    function norssitService($q, $location, _, FacetResultHandler, SPARQL_ENDPOINT_URL,
            AdvancedSparqlService, personMapperService) {

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
        // Update sorting URL params.
        this.updateSortBy = updateSortBy;
        // Get the CSS class for the sort icon.
        this.getSortClass = getSortClass;
        // Get the details of a single person.
        this.getPerson = getPerson;
        // Get the achievements of a person.
        this.getAchievements = getAchievements;

        /* Implementation */

        var facets = {
            // Text search facet for name
            entryText: {
                facetId: 'entryText',
                predicate: '<http://ldf.fi/nbf/biography>/<http://schema.org/description>',
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
                predicate: '<http://www.w3.org/2004/02/skos/core#prefLabel>',
                name: 'Sukunimi'
            },
            birthYear: {
                facetId: 'birthYear',
                predicate: '^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>/<http://ldf.fi/nbf/time>',
                name: 'Synnyinvuosi',
                enabled: true
            },
            birthPlace: {
                facetId: 'birthPlace',
                predicate: '^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>/<http://ldf.fi/nbf/place>',
                name: 'Syntymäpaikka',
                enabled: true
            },
            deathYear: {
                facetId: 'birthYear',
                predicate: '^<http://www.cidoc-crm.org/cidoc-crm/P100_was_death_of>/<http://ldf.fi/nbf/time>',
                name: 'Kuolinvuosi',
                enabled: true
            },
            deathPlace: {
                facetId: 'deathPlace',
                predicate: '^<http://www.cidoc-crm.org/cidoc-crm/P100_was_death_of>/<http://ldf.fi/nbf/place>',
                name: 'Kuolinpaikka',
                enabled: true
            },
            occupation: {
                facetId: 'occupation',
                predicate: '<http://ldf.fi/schema/bioc/has_profession>',
                name: 'Arvo tai ammatti',
                enabled: true
            },
            period: {
            	facetId: 'period',
                predicate: '<http://ldf.fi/nbf/has_period>', 
                name: 'Aikakausi',
                enabled: true
            },
            category: {
                facetId: 'category',
                predicate: '<http://ldf.fi/nbf/has_category>', 
                name: 'Kategoria',
                enabled: true
            },
            gender: {
                facetId: 'gender',
                predicate: '<http://schema.org/gender>',
                name: 'Sukupuoli',
                enabled: true
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
        ' PREFIX nbf: <http://ldf.fi/nbf/> ' +
        ' PREFIX categories:	<http://ldf.fi/nbf/categories/> ' +
        ' PREFIX occupations: <http://ldf.fi/nbf/occupations/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ';

        // The query for the results.
        // ?id is bound to the norssit URI.
        var query =
        ' SELECT DISTINCT * WHERE {' +
        '  { ' +
        '    <RESULT_SET> ' +
        '  } ' +
        '  OPTIONAL { ?id schema:givenName ?givenName . }' +
        '  OPTIONAL { ?id skos:prefLabel ?familyName . }' +
        '  OPTIONAL { ?id ^crm:P98_brought_into_life/nbf:place ?birthPlace . } ' +
        '  OPTIONAL { ?id norssit:ordinal ?ordinal . } ' +
        '  OPTIONAL { ?id norssit:register_id ?registerNumber . } ' +
        '  OPTIONAL { ?id ^crm:P98_brought_into_life/nbf:time ?birthDate . }' +
        '  OPTIONAL { ?id ^crm:P100_was_death_of/nbf:time ?deathDate . }' +
        '  OPTIONAL { ?id ^crm:P100_was_death_of/nbf:place ?deathPlace . }' +
        '  OPTIONAL { ?id schema:gender ?gender . }' +
        '  OPTIONAL { ?id schema:hobby/skos:prefLabel ?hobby . }' +
        '  OPTIONAL { ?id schema:image ?images . }' +
        '  OPTIONAL { ?id dct:description ?description . }' +
        '  OPTIONAL { ?id person_registry:pageNumber ?pageNumber . }' +
        '  OPTIONAL { ?id person_registry:pageImageURL ?pageImageURL . }' +
        '  OPTIONAL { ?id person_registry:enrollmentYear ?enrollmentYear . }' +
        '  OPTIONAL { ?id person_registry:matriculationYear ?matriculationYear . }' +
        '  OPTIONAL { ?id person_registry:entryText ?entryText . }' +
        '  OPTIONAL { ?id norssit:wikipedia ?wikipedia . }' +
        '  OPTIONAL { ?id norssit:viaf ?viaf . }' +
        '  OPTIONAL { ?id norssit:wikidata ?wikidata . }' +
        '  OPTIONAL { ?id bioc:has_profession/skos:prefLabel ?occupation . }' +
        '  OPTIONAL { ?id nbf:has_category ?category . }' +
        ' }';

        var achievementQuery = prefixes +
        ' SELECT DISTINCT ?id ?label ?wikipedia { ' +
        '  VALUES ?person { <ID> } ' +
        '  ?ach rdfs:subPropertyOf* nach:involved_in .' +
        '  ?person ?ach ?id . ' +
        '  ?id skos:prefLabel ?label .' +
        '  ?id norssit:wikipedia|norssit:www ?wikipedia .' +
        ' } ';

        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };

        var facetOptions = {
            endpointUrl: endpointConfig.endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/Person>',
            preferredLang : 'fi'
        };

        var resultOptions = {
            mapper: personMapperService,
            queryTemplate: query,
            prefixes: prefixes,
            paging: true,
            pagesPerQuery: 2 // get two pages of results per query
        };

        // The FacetResultHandler handles forming the final queries for results,
        // querying the endpoint, and mapping the results to objects.
        var resultHandler = new FacetResultHandler(endpointConfig, resultOptions);

        // This handler is for the additional queries.
        var endpoint = new AdvancedSparqlService(endpointConfig, personMapperService);

        function getResults(facetSelections) {
            return resultHandler.getResults(facetSelections, getSortBy());
        }

        function getPerson(id) {
            var qry = prefixes + query;
            var constraint = 'VALUES ?id { <' + id + '> } ';
            return endpoint.getObjects(qry.replace('<RESULT_SET>', constraint))
            .then(function(person) {
                if (person.length) {
                    return person[0];
                }
                return $q.reject('Not found');
            });
        }

        function getAchievements(person) {
            if (!person.hasAchievements || person.achievements) {
                return person;
            }
            var qry = achievementQuery.replace('<ID>', '<' + person.id + '>');
            return endpoint.getObjects(qry).then(function(achievements) {
                person.achievements = achievements;
                return person;
            });
        }

        function getFacets() {
            var facetsCopy = angular.copy(facets);
            return $q.when(facetsCopy);
        }

        function getFacetOptions() {
            return facetOptions;
        }

        function updateSortBy(sortBy) {
            var sort = $location.search().sortBy || '?ordinal';
            if (sort === sortBy) {
                $location.search('desc', $location.search().desc ? null : true);
            }
            $location.search('sortBy', sortBy);
        }

        function getSortBy() {
            var sortBy = $location.search().sortBy;
            if (!_.isString(sortBy)) {
                sortBy = '?ordinal';
            }
            var sort;
            if ($location.search().desc) {
                sort = 'DESC(' + sortBy + ')';
            } else {
                sort = sortBy;
            }
            return sortBy === '?ordinal' ? sort : sort + ' ?ordinal';
        }

        function getSortClass(sortBy, numeric) {
            var sort = $location.search().sortBy || '?ordinal';
            var cls = numeric ? 'glyphicon-sort-by-order' : 'glyphicon-sort-by-alphabet';

            if (sort === sortBy) {
                if ($location.search().desc) {
                    return cls + '-alt';
                }
                return cls;
            }
        }
    }
})();
