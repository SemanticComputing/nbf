(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('networkService', networkService);

    /* @ngInject */
    function networkService($q, $location, _, mapfacetService, FacetResultHandler, SPARQL_ENDPOINT_URL,
            AdvancedSparqlService, personMapperService) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = mapfacetService.getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;
        // Update sorting URL params.
        this.updateSortBy = updateSortBy;
        // Get the CSS class for the sort icon.
        this.getSortClass = getSortClass;
        // Get the details of a single person.
        // this.getPerson = getPerson;

        /* Implementation */

        var prefixes =
        	'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        	'PREFIX bioc:  <http://ldf.fi/schema/bioc/> ' +
        	'PREFIX categories: <http://ldf.fi/nbf/categories/> ' +
        	'PREFIX gvp: <http://vocab.getty.edu/ontology#> ' +
        	'PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        	'PREFIX nbf: <http://ldf.fi/nbf/> ' +
        	'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        	'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        	'PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        	'PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
        	'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        	'PREFIX schema: <http://schema.org/> ' +
        	'PREFIX nbfbio: <http://ldf.fi/nbf/biography/data#> ' +
        	'PREFIX dcterm: <http://purl.org/dc/terms/> ' +
        	'PREFIX dce: <http://purl.org/dc/elements/1.1/> ';

        // The query for the results.
        // http://yasgui.org/short/SkYoy7fzX
        var query =
        'SELECT distinct ?id ?id_name ?id2 ?id2_name WHERE { ' +
    	'  { <RESULT_SET> }' +
    	'  SERVICE <http://ldf.fi/nbf-nlp/sparql> { ' +
    	'    ?par dcterm:isPartOf/nbfbio:bioId ?id ; ' +
    	'    	dce:source/nbfbio:link ?target_link . ' +
    	'    BIND(STRAFTER(STR(?target_link), "data/") AS ?target) ' +
    	'  } ' +
    	'  ?id2 nbf:formatted_link ?target . ' +
    	'  ' +
    	'  ?id skosxl:prefLabel ?id__label . ' +
    	'  OPTIONAL { ?id__label schema:familyName ?id__fname } ' +
    	'  OPTIONAL { ?id__label schema:givenName ?id__gname } ' +
    	'  BIND (CONCAT(COALESCE(?id__gname, "")," ",COALESCE(?id__fname, "")) AS ?id_name) ' +
    	'  ' +
    	'  ?id2 skosxl:prefLabel ?id2__label . ' +
    	'  OPTIONAL { ?id2__label schema:familyName ?id2__fname } ' +
    	'  OPTIONAL { ?id2__label schema:givenName ?id2__gname } ' +
    	'  BIND (CONCAT(COALESCE(?id2__gname, "")," ",COALESCE(?id2__fname, "")) AS ?id2_name) ' +
    	'} LIMIT 1000 ';

        
        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };

        var facetOptions = {
            endpointUrl: endpointConfig.endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/PersonConcept>',
            constraint: '?id <http://ldf.fi/nbf/ordinal> ?ordinal . ',
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

        function getResults(facetSelections) {
        	var q = prefixes + query.replace("<RESULT_SET>", facetSelections.constraint.join(' '));
        	// console.log(q);
        	var res = endpoint.getObjectsNoGrouping(q);
        	// console.log(res);
        	return res;
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
