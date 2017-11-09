(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('groupmapService', groupmapService);

    /* @ngInject */
    function groupmapService($q, $location, _, FacetResultHandler, SPARQL_ENDPOINT_URL,
            AdvancedSparqlService, personMapperService) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        //this.getResults = getResults;
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
        // Get the events of a single person.
        this.getEvents = getEvents;
        
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
        ' PREFIX categories: <http://ldf.fi/nbf/categories/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX gvp: <http://vocab.getty.edu/ontology#> ';
        
        // The query for the results.
        // ?id is bound to the event URI.
        var query = 
            'SELECT DISTINCT ?id ?prs ?time__start ?time__end ?class ?place__uri ?place__latitude ?place__longitude WHERE {' +
            '  { VALUES ?eraStart { "1870-01-01"^^xsd:date }' +
            '    VALUES ?eraEnd { "1880-01-01"^^xsd:date } }' +
            //'  { ?prs bioc:has_family_relation ?id }' +
            //'  UNION ' +
            '  { ?id crm:P100_was_death_of ?prs . }' +
            '  UNION   { ?id crm:P98_brought_into_life ?prs . }' +
            //'  UNION   { ?id bioc:inheres_in ?prs . }' +
            '  ' +
            '  ?id nbf:time ?time ;' +
            '  	   nbf:place ?place__uri . ' +
            '  OPTIONAL { ?time gvp:estStart ?time__start. FILTER (?eraStart<?time__start && ?time__start<?eraEnd) } ' +
            '  OPTIONAL { ?time gvp:estEnd ?time__end. FILTER (?eraStart<?time__end && ?time__end<?eraEnd) } ' +
            '  FILTER (BOUND(?time__start) || BOUND(?time__end))' +
            '  BIND ( CONCAT( IF(bound(?time__start),str(year(?time__start)),"") ,"-", IF(bound(?time__end),str(year(?time__end)),"") ) AS ?time__span)   ' +
            '  ' +
            '  ?id a/skos:prefLabel ?class .' +
            '  FILTER (lang(?class)="en")' +
            '  ' +
            '    ?place__uri geo:lat ?place__latitude ; ' +
            '           geo:long ?place__longitude . ' +
            '} ORDER BY ?time__start DESC(?time__end) LIMIT 500';

        
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
        
        function getEvents(id) {
            var qry = prefixes + query;
            // console.log(qry);
            var constraint = 'VALUES ?idorg { <' + id + '> } . ?idorg owl:sameAs* ?pc . ';
            // console.log(qry.replace('<RESULT_SET>', constraint));
            return endpoint.getObjects(qry.replace('<RESULT_SET>', constraint))
            .then(function(events) {
                if (events.length) {
                	console.log(events);
                    return events;
                }
                return $q.reject('No events found');
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
