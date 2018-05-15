(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('nbfService', nbfService);

    /* @ngInject */
    function nbfService($q, $location, _, facetService, FacetResultHandler, SPARQL_ENDPOINT_URL,
            AdvancedSparqlService, personMapperService) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = facetService.getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = facetService.getFacetOptions;
        // Update sorting URL params.
        this.updateSortBy = updateSortBy;
        // Get the CSS class for the sort icon.
        this.getSortClass = getSortClass;
        // Get the details of a single person.
        this.getPerson = getPerson;
        this.getSimilar = getSimilar;
        this.getBios = getBios;

        /* Implementation */

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
        '  }' +
        '  FILTER not exists { ?id owl:sameAs [] }' +
        '  ?id skosxl:prefLabel ?plabel . ' +
        '  		OPTIONAL { ?plabel schema:givenName ?givenName . }' +
        '  		OPTIONAL { ?plabel schema:familyName ?familyName . }' +
        '' +
        '  OPTIONAL { ?id nbf:viaf ?viaf . }' +
        '  OPTIONAL { ?id nbf:ulan ?ulan . }' +
        '  OPTIONAL { ?id nbf:wikidata ?wikidata . }' +
        '  OPTIONAL { ?id nbf:wikipedia ?wikipedia . }' +
        '  OPTIONAL { ?id nbf:fennica ?fennica . }' +
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
        ' }' +
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
            '  OPTIONAL { ?id nbf:fennica ?fennica . }' +
            '  OPTIONAL { ?id nbf:blf ?blf . }' +
            '  OPTIONAL { ?id nbf:website ?website . }' +
            '  OPTIONAL { ?id nbf:eduskunta ?eduskunta . }' +
            '  OPTIONAL { ?id nbf:warsampo ?warsampo . }' +
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
            '  		?relative__id skosxl:prefLabel ?relative__label . ' +
            '  		OPTIONAL { ?relative__label schema:familyName ?relative__familyName } ' +
            '  		OPTIONAL { ?relative__label schema:givenName ?relative__givenName } ' +
            '  		BIND (REPLACE(CONCAT( COALESCE(?relative__givenName,"") ," ", COALESCE(?relative__familyName,"")),"[(][^)]+[)]\\\\s*","") AS ?relative__name)  ' + 
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
            '  }' +
            ' }';

        var bioQuery =
            'SELECT DISTINCT * WHERE {' +
            ' { <RESULT_SET> }' +
            ' ?id owl:sameAs*|^owl:sameAs ?prs .' +
            ' ?prs foaf:focus/nbf:has_biography ?bio .' +
            '  OPTIONAL { ?bio dct:source ?source . ?source skos:prefLabel ?database }' +
            '  OPTIONAL { ?bio nbf:authors ?author_text }' +
            '  OPTIONAL { ?bio schema:dateCreated ?created }' +
            '  OPTIONAL { ?bio schema:dateModified ?modified }' +
            '  OPTIONAL { ?bio schema:relatedLink ?link }'  +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "0"^^xsd:integer ; nbf:content ?lead_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "1"^^xsd:integer ; nbf:content ?description    ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "2"^^xsd:integer ; nbf:content ?family_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "3"^^xsd:integer ; nbf:content ?parent_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "4"^^xsd:integer ; nbf:content ?spouse_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "5"^^xsd:integer ; nbf:content ?child_paragraph  ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "6"^^xsd:integer ; nbf:content ?medal_paragraph  ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "7"^^xsd:integer ; nbf:content ?source_paragraph ] }' +
            '} ORDER BY str(?source)';


        //	http://yasgui.org/short/rywI3KnBz
        var querySimilar =
            'SELECT DISTINCT ?prs ?label WHERE { ' +
            '  { <RESULT_SET> }' +
            '  { ' +
            '    ?dst bioc:relates_to ?id ; bioc:relates_to ?prs ; bioc:value ?val .   ' +
            '  } UNION {   ' +
            '    ?dst bioc:relates_to ?id ; bioc:relates_to ?idX ; bioc:value ?valX .   ' +
            '    ?dst2 bioc:relates_to ?idX ; bioc:relates_to ?prs ; bioc:value ?val2 .     ' +
            '    BIND (?valX+?val2 AS ?val) ' +
            '  } UNION {  ' +
            '    ?dst bioc:relates_to ?id ; bioc:relates_to ?idX ; bioc:value ?valX . ' +
            '    ?dst2 bioc:relates_to ?idX ; bioc:relates_to ?idY ; bioc:value ?valY .     ' +
            '    ?dst3 bioc:relates_to ?idY ; bioc:relates_to ?prs ; bioc:value ?val2 .     ' +
            '    BIND (?valX+?valY+?val2 AS ?val) ' +
            '  } ' +
            '  FILTER (?id != ?prs) ' +
            '  OPTIONAL { ?prs skosxl:prefLabel/schema:familyName ?fname . } ' +
            '  OPTIONAL { ?prs skosxl:prefLabel/schema:givenName ?gname . } ' +
            '  BIND (CONCAT(COALESCE(?gname, "")," ",COALESCE(?fname, "")) AS ?label)' +
            '} ORDER by ?val LIMIT 16 ';

        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
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

        function getBios(id) {
            var qry = prefixes + bioQuery;
            var constraint = 'VALUES ?id { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
                return result;
            });
        }
        function getSimilar(id) {
            var qry = prefixes + querySimilar;
            var constraint = 'VALUES ?id { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
                return result;
            });
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
            
            if (sortBy === '?ordinal') {
	            if ($location.search().desc) {
	                sort = sortBy;
	            } else {
	                sort = 'DESC(' + sortBy + ')';
	            }
            } else {
            	if ($location.search().desc) {
	                sort = 'DESC(' + sortBy + ')';
	            } else {
	                sort = sortBy;
	            }
            }
            return sortBy === '?ordinal' ? sort : sort + ' ?ordinal';
        }

        function getSortClass(sortBy, numeric) {
            var sort = $location.search().sortBy || '?ordinal';
            var cls = numeric ? 'glyphicon-sort-by-order' : 'glyphicon-sort-by-alphabet';
            
            if (sortBy === '?ordinal') {
	            if (sort === sortBy) {
	                if ($location.search().desc) {
	                    return cls;
	                }
	                return cls + '-alt';
	            }
            } else {
            	if (sort === sortBy) {
	                if ($location.search().desc) {
	                    return cls + '-alt';
	                }
	                return cls;
	            }
            }
        }
    }
})();
