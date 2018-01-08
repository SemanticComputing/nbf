(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('nbfService', nbfService);

    /* @ngInject */
    function nbfService($q, $location, _, FacetResultHandler, SPARQL_ENDPOINT_URL,
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
        this.getSimilar = getSimilar;

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
                name: 'Arvo tai ammatti',
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

        var prefixes =
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX schema: <http://schema.org/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
        ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ' +
        ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
        ' PREFIX nbf: <http://ldf.fi/nbf/> ' +
        ' PREFIX categories:	<http://ldf.fi/nbf/categories/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ';

        // The query for the results.
        // ?id is bound to the person URI.
        var query =
        ' SELECT DISTINCT * WHERE {' +
        '  { ' +
        '    <RESULT_SET> ' +
        '  } ' +
        '  ?id skosxl:prefLabel ?plabel . ' +
        '  		OPTIONAL { ?plabel schema:givenName ?givenName . }' +
        '  		OPTIONAL { ?plabel schema:familyName ?familyName . }' +
        ' ' +
        '  OPTIONAL { ?id nbf:viaf ?viaf . }' +
        '  OPTIONAL { ?id nbf:ulan ?ulan . }' +
        '  OPTIONAL { ?id nbf:wikidata ?wikidata . }' +
        '  OPTIONAL { ?id nbf:wikipedia ?wikipedia . }' +
        '  OPTIONAL { ?id nbf:warsampo ?warsampo . }' +
        '  OPTIONAL { ?id nbf:norssi ?norssi . }' +
        '  OPTIONAL { ?id nbf:blf ?blf . }' +
        '  OPTIONAL { ?id nbf:website ?website . }' +
        '  OPTIONAL { ?id nbf:genicom ?genicom . }' +
        '  OPTIONAL { ?id nbf:genitree ?genitree . }' +
        '  OPTIONAL { ?id nbf:eduskunta ?eduskunta . }' +
        '  OPTIONAL { ?id nbf:kirjasampo ?kirjasampo . }' +
        '  OPTIONAL { ?id schema:relatedLink ?kansallisbiografia . }' +
        '  OPTIONAL { ?id foaf:focus ?prs . ' +
        '  		OPTIONAL { ?prs ^crm:P98_brought_into_life/nbf:place ?birthPlace . filter (isliteral(?birthPlace)) } ' +
        '  		OPTIONAL { ?prs ^crm:P98_brought_into_life/nbf:time/skos:prefLabel ?birthDate . }' +
        '  		OPTIONAL { ?prs ^crm:P100_was_death_of/nbf:time/skos:prefLabel ?deathDate . }' +
        '  		OPTIONAL { ?prs ^crm:P100_was_death_of/nbf:place ?deathPlace . filter (isliteral(?deathPlace)) }' +
        '  		OPTIONAL { ?prs schema:gender ?gender . }' +
        '  		OPTIONAL { ?prs schema:image ?images . }' +
        '  		OPTIONAL { ?prs ^bioc:inheres_in ?occupation_id . ' +
        '  			?occupation_id a nbf:Occupation ; skos:prefLabel ?occupation ' +
        '  			OPTIONAL { ?occupation_id nbf:related_company ?company . }' +
        '		}' +
        '  		OPTIONAL { ?prs nbf:has_category ?category . }'  +
        '  		OPTIONAL { ?prs nbf:has_biography ?bio . ' +
        '  			OPTIONAL { ?bio nbf:has_paragraph [ nbf:content ?lead_paragraph ; nbf:id "0"^^xsd:integer  ] }' +
        '  		}' +
        '  }' +
        ' }';

        var detailQuery =
            ' SELECT DISTINCT * WHERE {' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
            '  ?id skosxl:prefLabel ?plabel . ' +
            '  		OPTIONAL { ?plabel schema:givenName ?givenName . }' +
            '  		OPTIONAL { ?plabel schema:familyName ?familyName . }' +
            ' ' +
            '  OPTIONAL { ?id nbf:viaf ?viaf . }' +
            '  OPTIONAL { ?id nbf:ulan ?ulan . }' +
            '  OPTIONAL { ?id nbf:wikidata ?wikidata . }' +
            '  OPTIONAL { ?id nbf:wikipedia ?wikipedia . }' +
            '  OPTIONAL { ?id nbf:blf ?blf . }' +
            '  OPTIONAL { ?id nbf:website ?website . }' +
            '  OPTIONAL { ?id nbf:eduskunta ?eduskunta . }' +
            '  OPTIONAL { ?id nbf:norssi ?norssi . }' +
            '  OPTIONAL { ?id nbf:kirjasampo ?kirjasampo . }' +
            '  OPTIONAL { ?id nbf:website ?website . }' +
            '  OPTIONAL { ?id nbf:genicom ?genicom . }' +
            '  OPTIONAL { ?id nbf:genitree ?genitree . }' +
            '  OPTIONAL { ?id schema:relatedLink ?kansallisbiografia . }' +
            '  OPTIONAL { { ?id bioc:has_family_relation [ ' +
            '  		bioc:inheres_in ?relative__id ; ' +
            '  		a/skos:prefLabel ?relative__type ] . } ' +
            '		UNION { ?relative__id bioc:has_family_relation [ ' +
            '  		bioc:inheres_in ?id ; ' +
            '  		bioc:inverse_role/skos:prefLabel ?relative__type ] . } ' +
            '  		FILTER (LANG(?relative__type)="fi") ' +
            '  		?relative__id skosxl:prefLabel/schema:familyName ?relative__familyName ; ' +
            '			skosxl:prefLabel/schema:givenName ?relative__givenName .' +
            '  		BIND (replace(concat(?relative__givenName," ",?relative__familyName),"[(][^)]+[)]\\\\s*","") AS ?relative__name)  ' +
            '  } ' +
            '  OPTIONAL { ?id foaf:focus ?prs . ' +
            '  		OPTIONAL { ?prs ^crm:P98_brought_into_life ?bir . ' +
            '  			OPTIONAL { ?bir nbf:place ?birthPlace . filter (isliteral(?birthPlace)) } ' +
            '  			OPTIONAL { ?bir nbf:time/skos:prefLabel ?birthDate . }' +
            '		} ' +
            '  		OPTIONAL { ?prs ^crm:P100_was_death_of ?dea . ' +
            '			OPTIONAL { ?dea nbf:time/skos:prefLabel ?deathDate . }' +
            '  			OPTIONAL { ?dea nbf:place ?deathPlace . filter (isliteral(?deathPlace)) }' +
            '		} ' +
            '  		OPTIONAL { ?prs schema:image ?images . }' +
            '  		OPTIONAL { ?prs ^bioc:inheres_in ?occupation_id . ' +
            '  			?occupation_id a nbf:Occupation ; skos:prefLabel ?occupation }' +
            '  		OPTIONAL { ?prs nbf:has_category ?category . }'  +
            '  		OPTIONAL { ?prs nbf:has_biography ?bio . ' +
            '  			OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "0"^^xsd:integer ; nbf:content ?lead_paragraph ] }' +
            '  			OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "1"^^xsd:integer ; nbf:content ?description    ] }' +
            '  			OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "2"^^xsd:integer ; nbf:content ?family_paragraph ] }' +
            '  			OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "3"^^xsd:integer ; nbf:content ?parent_paragraph ] }' +
            '  			OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "4"^^xsd:integer ; nbf:content ?spouse_paragraph ] }' +
            '  			OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "5"^^xsd:integer ; nbf:content ?child_paragraph  ] }' +
            '  			OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "6"^^xsd:integer ; nbf:content ?medal_paragraph  ] }' +
            '  			OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "7"^^xsd:integer ; nbf:content ?source_paragraph ] }' +
            '  		}' +
            '  }' +
            ' }';
        
        var querySimilar = 
        	'SELECT DISTINCT ?prs ?label WHERE { ' +
        	'  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
            '  {' +
            '  ?dst bioc:relates_to ?id ;' +
            '       bioc:relates_to ?prs ;' +
            '       bioc:value ?val .' +
            '  } UNION {' +
            '  ?dst bioc:relates_to ?id ;' +
            '       bioc:relates_to ?idX ;' +
            '       bioc:value ?valX .' +
            '  ?dst2 bioc:relates_to ?idX ;' +
            '       bioc:relates_to ?prs ;' +
            '       bioc:value ?val2 .' +
            '    BIND (?valX+?val2 AS ?val) ' +
            '  } ' +
            '  FILTER (?id != ?prs)' +
            '  ?prs skos:prefLabel ?label  .' +
            '} ORDER by ?val LIMIT 10';
        
        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };

        var facetOptions = {
            endpointUrl: endpointConfig.endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/PersonConcept>',
            constraint: '?id <http://www.w3.org/2004/02/skos/core#prefLabel> ?familyName . ?id <http://ldf.fi/nbf/ordinal> ?ordinal . ',
            preferredLang : 'fi',
            noSelectionString: '-- Ei valintaa --'
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
        	var qry = prefixes + detailQuery;
            var constraint = 'VALUES ?idorg { <' + id + '> } . ?idorg owl:sameAs* ?id . ';
            return endpoint.getObjects(qry.replace('<RESULT_SET>', constraint))
            .then(function(person) {
                if (person.length) {
                    return person[person.length-1];
                }
                return $q.reject('Not found');
            });
        }
        
        function getSimilar(id) {
        	// console.log("getSimilar", id);
            var qry = prefixes + querySimilar;
            var constraint = 'VALUES ?id { <' + id + '> } . ';
            // console.log(qry.replace('<RESULT_SET>', constraint));
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
            	return result;
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
