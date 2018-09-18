(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('groupmapService', groupmapService);

    /* @ngInject */
    function groupmapService($q, $location, _, FacetResultHandler, 
    		SPARQL_ENDPOINT_URL, mapfacetService,
            AdvancedSparqlService, personMapperService) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        this.getResults2 = getResults2;
        this.getResults3 = getResults3;
        
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = mapfacetService.getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;

        
        // Update sorting URL params.
        //this.updateSortBy = updateSortBy;
        // Get the CSS class for the sort icon.
        // this.getSortClassOLD = getSortClass;

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
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX gvp: <http://vocab.getty.edu/ontology#> ';

        //	example query 
        var query = 'SELECT * WHERE { ' +
    	'  { SELECT ?place__uri (COUNT(DISTINCT ?url) AS ?count) (GROUP_CONCAT(DISTINCT ?url; separator=",") AS ?person__ids) ?type WHERE {  ' +
    	'    { SELECT ?id ?id2 WHERE { <RESULT_SET> ?id owl:sameAs* ?id2 . FILTER NOT EXISTS { ?id2 owl:sameAs [] }' +
    	' } LIMIT <LIMIT> } FILTER(BOUND(?id)) ' +
    	' ' +
    	'    VALUES (?prop ?eclass ?type) { <VALUES> } ' +
    	'    ?id foaf:focus ?prs . ' +
    	'    ?evt__id ?prop ?prs ; ' +
    	'          a ?eclass ;  ' +
    	'          nbf:place ?place__uri . ' +
    	'  BIND (replace(str(?id2),"http://ldf.fi/nbf/","") AS ?url)' +
    	'    } GROUP BY ?place__uri ?type ORDER BY DESC(?count) ' +
    	'  } ' +
    	'  FILTER (?count>0) ' +
    	'  ?place__uri geo:lat ?place__latitude ; ' +
    	'        	geo:long ?place__longitude ; ' +
    	'    		skos:prefLabel ?place__label . ' +
    	'  FILTER (lang(?place__label)="fi") ' +
    	'}  '
        
    	
        // http://yasgui.org/short/rkRBPKYU7
        var query2 = 
        	'SELECT * WHERE { ' +
        	'  { ' +
        	'  SELECT DISTINCT ?birth__place ?death__place (COUNT(distinct ?url) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?person__ids) WHERE { ' +
        	'    <RESULT_SET> ' +
        	'    ?id owl:sameAs* ?id2 . ' +
        	'    FILTER NOT EXISTS { ?id2 owl:sameAs [] } . ' +
        	'    ?id foaf:focus ?prs . ' +
        	' ' +
        	'    ?birth__id crm:P98_brought_into_life ?prs ; ' +
        	'              nbf:place ?birth__place . ' +
        	' ' +
        	'    ?death__id crm:P100_was_death_of ?prs ; ' +
        	'               nbf:place ?death__place . ' +
        	'       ' +
        	'    BIND (replace(str(?id2),"http://ldf.fi/nbf/","") AS ?url)' +
        	'    } GROUP BY ?birth__place ?death__place ORDER BY DESC(?count) LIMIT <LIMIT>  } ' +
        	'  FILTER (?count>0) ' +
        	'  ?birth__place geo:lat ?birth__latitude ; ' +
        	'              geo:long ?birth__longitude ; ' +
        	'              skos:prefLabel ?birth__label . ' +
        	'  FILTER (LANG(?birth__label)="fi") ' +
        	'   ' +
        	'  ?death__place geo:lat ?death__latitude ; ' +
        	'              geo:long ?death__longitude ; ' +
        	'              skos:prefLabel ?death__label . ' +
        	'  FILTER (LANG(?death__label)="fi") ' +
        	'} ORDER BY ?count ';
        	
        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };

        var facetOptions = {
            endpointUrl: endpointConfig.endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/PersonConcept>',
            constraint: '?id <http://ldf.fi/nbf/ordinal> ?ordinal . ',
            			// + '[] (<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>)/^<http://xmlns.com/foaf/0.1/focus> ?id . ',
            preferredLang : 'fi',
            noSelectionString: '-- Ei valintaa --'
        };

        var resultOptions = {
            mapper: personMapperService,
            queryTemplate: query,
            prefixes: prefixes,
            paging: false,
            pagesPerQuery: 1
        };

        // The FacetResultHandler handles forming the final queries for results,
        // querying the endpoint, and mapping the results to objects.
        var resultHandler = new FacetResultHandler(endpointConfig, resultOptions);

        // This handler is for the additional queries.
        var endpoint = new AdvancedSparqlService(endpointConfig, personMapperService);

        function getResults(facetSelections, selections, limit) {
        	var values = 
        		(selections[0] ? '( crm:P98_brought_into_life nbf:Birth 0) ' : '') +
	        	(selections[1] ? '( crm:P100_was_death_of nbf:Death 1) ' : '') +
	        	(selections[2] ? '( bioc:inheres_in nbf:Career 2 ) ' : '') +
	        	(selections[3] ? '( bioc:inheres_in nbf:Product 3 ) ' : '') +
	        	(selections[4] ? '( bioc:inheres_in nbf:Honour 4 ) ' : '') ,
        	
        		q = prefixes + query.replace("<RESULT_SET>", facetSelections.constraint.join(' '))
        		.replace("<VALUES>", values)
        		.replace("<LIMIT>", limit);
        	
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getResults2(facetSelections, limit) {
        	var q = prefixes + 
        		query2
        			.replace("<RESULT_SET>", facetSelections.constraint.join(' '))
        			.replace("<LIMIT>", limit);
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getResults3(facetSelections, selections) {
        	//	http://yasgui.org/short/r1w6rEE8m
        	var query = 'SELECT ?evt__lat ?evt__long (COUNT(?prs) AS ?count) ?type WHERE { ' +
        	'    <RESULT_SET> ' +
        	'       ' +
        	'    ?id foaf:focus ?prs . ' +
        	'  VALUES (?prop ?eclass ?type) { ' +
        	(selections[0] ? '( crm:P98_brought_into_life nbf:Birth 0) ' : '') +
        	(selections[1] ? '( crm:P100_was_death_of nbf:Death 1) ' : '') +
        	(selections[2] ? '( bioc:inheres_in nbf:Career 2 ) ' : '') +
        	(selections[3] ? '( bioc:inheres_in nbf:Product 3 ) ' : '') +
        	(selections[4] ? '( bioc:inheres_in nbf:Honour 4 ) ' : '') +
        	'  } ' +
        	'  ?evt__id ?prop ?prs ;  ' +
        	'    a ?eclass ;  ' +
        	'  	nbf:place [  ' +
        	'      		geo:lat ?evt__lat ; ' +
        	'      		geo:long ?evt__long  ' +
        	'  ] . ' +
        	'} GROUP BY ?evt__lat ?evt__long ?evt__class ?type HAVING(?count>0) LIMIT 500 ';
        	
        	var q = prefixes + query.replace("<RESULT_SET>", facetSelections.constraint.join(' '));
        	
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getFacetsOLD() {
            var facetsCopy = angular.copy(facets);
            return $q.when(facetsCopy);
        }

        function getFacetOptions() {
            return facetOptions;
        }
        
        /*
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
         */
        
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
