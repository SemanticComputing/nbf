(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('popoverService', popoverService);

    /* @ngInject */
    function popoverService(// $q, $location, _, facetService, FacetResultHandler, 
    		SPARQL_ENDPOINT_URL,
            AdvancedSparqlService
            // , personMapperService
            ) {

        /* Public API */

        
        this.getPopover = getPopover;
        this.getHrefPopover = getHrefPopover;
        this.getPopoverGroup = getPopoverGroup;
        this.getPlacePopover = getPlacePopover;
        this.getPopoverPairs = getPopoverPairs;
        
        /* Implementation */

        var prefixes =
        	' PREFIX bioc: <http://ldf.fi/schema/bioc/>' +
        	' PREFIX categories: <http://ldf.fi/nbf/categories/>' +
        	' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
        	' PREFIX dct: <http://purl.org/dc/terms/>' +
        	' PREFIX foaf: <http://xmlns.com/foaf/0.1/>' +
        	' PREFIX gvp: <http://vocab.getty.edu/ontology#>' +
        	' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
	        ' PREFIX owl: <http://www.w3.org/2002/07/owl#>' +
        	' PREFIX nbf: <http://ldf.fi/nbf/>' +
	        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
	        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +
	        ' PREFIX rels: <http://ldf.fi/nbf/relations/>' +
	        ' PREFIX schema: <http://schema.org/>' +
	        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
	        ' PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>' +
	        ' PREFIX sources: <http://ldf.fi/nbf/sources/>' +
	        ' PREFIX xml: <http://www.w3.org/XML/1998/namespace>' +
	        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ';

        
        //	http://yasgui.org/short/wgnwg0hUF
        var queryForPopover =
        	'SELECT DISTINCT ?id ?label ?image ?lifespan ?hasbio ' +
        	'WHERE {' +
        	'  <RESULT_SET> ' +
        	'  ?id2 owl:sameAs* ?id . FILTER NOT EXISTS { ?id owl:sameAs [] } ' +
        	'  ?id foaf:focus ?prs .' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image1 ; dct:source ?s ] FILTER ISLITERAL(?s) } ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image2 ; dct:source sources:source10 ] } ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image3 ; dct:source/skos:prefLabel ?s ]  } ' +
        	'  BIND (COALESCE(?image1, ?image2, ?image3) AS ?image) ' +
        	' ' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:givenName ?gname . }' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:familyName ?fname . }' +
        	'  BIND (CONCAT(COALESCE(?gname, "")," ",COALESCE(?fname, "")) AS ?label) ' +
        	'  OPTIONAL { ?prs ^crm:P98_brought_into_life/nbf:time ?bir . ?bir gvp:estStart ?btime ; skos:prefLabel [] } ' +
        	'  OPTIONAL { ?prs ^crm:P100_was_death_of/nbf:time ?dea . ?dea gvp:estStart ?dtime ; skos:prefLabel [] } ' +
        	'  BIND (CONCAT("(", COALESCE(STR(YEAR(?btime)), " "), "-", COALESCE(STR(YEAR(?dtime)), " "), ")") AS ?lifespan)' +
        	' ' +
        	'  OPTIONAL { ?prs nbf:has_biography [] . BIND (true as ?hasbio) }' +
        	'} LIMIT 1 '
        
        //	http://yasgui.org/short/SyK2-M6vm
        var queryForHref = 
        	'SELECT DISTINCT ?id ?label ?image ?lifespan ' +
        	'WHERE { ' +
        	'  { <RESULT_SET> } ' +
        	'  ?id nbf:formatted_link ?href ; ' +
        	'  		owl:sameAs*/foaf:focus ?prs . ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image1 ; dct:source ?s ] FILTER ISLITERAL(?s) } ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image2 ; dct:source sources:source10 ] } ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image3 ; dct:source/skos:prefLabel ?s ] } ' +
        	'  BIND (COALESCE(?image1, ?image2, ?image3) AS ?image) ' +
        	' ' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:familyName ?fname }' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:givenName ?gname }' +
        	'  BIND (CONCAT(COALESCE(?gname, "")," ",COALESCE(?fname, "")) AS ?label) ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?btime } ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P100_was_death_of/nbf:time/gvp:estStart ?dtime } ' +
        	'  BIND (CONCAT("(", COALESCE(STR(YEAR(?btime)), " "), "-", COALESCE(STR(YEAR(?dtime)), " "), ")") AS ?lifespan) ' +
        	'} LIMIT 1 ';
        
        //	http://yasgui.org/short/R6wNrFCHB
        var queryForPopoverGroup =
        	'SELECT DISTINCT ?id ?label ?lifespan (SAMPLE(?image0) AS ?image) WHERE { ' +
    	'  <RESULT_SET> ' +
    	'  ?id2 owl:sameAs* ?id .' +
    	'  FILTER NOT EXISTS {?id owl:sameAs []} ' +
    	'  ?id foaf:focus ?prs .' +
    	'  OPTIONAL { ?prs nbf:image [ schema:image ?image1 ; dct:source ?s ] FILTER ISLITERAL(?s) } ' +
    	'  OPTIONAL { ?prs nbf:image [ schema:image ?image2 ; dct:source sources:source10 ] } ' +
    	'  OPTIONAL { ?prs nbf:image [ schema:image ?image3 ; dct:source/skos:prefLabel ?s ] }' +
    	'  BIND (COALESCE(?image1, ?image2, ?image3) AS ?image0)' +
    	'  OPTIONAL { ?id skosxl:prefLabel/schema:familyName ?fname } ' +
    	'  OPTIONAL { ?id skosxl:prefLabel/schema:givenName ?gname } ' +
    	'  BIND (CONCAT(COALESCE(?gname, "")," ",COALESCE(?fname, "")) AS ?label) ' +
    	'  OPTIONAL { ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?btime } ' +
    	'  OPTIONAL { ?id foaf:focus/^crm:P100_was_death_of/nbf:time/gvp:estStart ?dtime } ' +
    	'  BIND (CONCAT("(", COALESCE(STR(YEAR(?btime)), " "), "-" , COALESCE(STR(YEAR(?dtime)), " "), ")") AS ?lifespan) ' +
    	'} GROUP BY ?id ?label ?lifespan ORDER BY UCASE(?fname) ?gname ';
        
        var queryForPopoverPairs =
        	'SELECT DISTINCT ?id ?label ?lifespan (SAMPLE(?image_0) AS ?image) ?no ' +
        	'WHERE { ' +
        	' <RESULT_SET> ' +
        	'  ?id2 owl:sameAs* ?id .' +
        	'  FILTER NOT EXISTS {?id owl:sameAs []} ' +
        	'  ?id foaf:focus ?prs .' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image_1 ; dct:source ?s ] FILTER ISLITERAL(?s) } ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image_2 ; dct:source sources:source10 ] } ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image_3 ; dct:source/skos:prefLabel ?s ]  } ' +
        	'  BIND (COALESCE(?image_1, ?image_2, ?image_3) AS ?image_0) ' +
        	' ' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:familyName ?fname . } ' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:givenName ?gname . } ' +
        	'  BIND (CONCAT(COALESCE(?gname, "")," ",COALESCE(?fname, "")) AS ?label) ' +
        	' ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?btime } ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P100_was_death_of/nbf:time/gvp:estStart ?dtime } ' +
        	'  BIND (CONCAT("(", COALESCE(STR(0+xsd:integer(YEAR(?btime))), " "), "-", COALESCE(STR(0+xsd:integer(YEAR(?dtime))), " "), ")") AS ?lifespan) ' +
        	' ' +
        	'} GROUP BY ?id ?label ?lifespan ?no ORDER BY ?no ';
        
    	var queryForPlacePopover =
    		'SELECT * WHERE { ' +
	    	'  <RESULT_SET> ' +
	    	'  ?id skos:prefLabel ?label . ' +
	    	'  FILTER (lang(?label)="fi") ' +
	    	'  OPTIONAL {' +
	    	'    ?id geo:lat ?latitude .' +
	    	'    ?id geo:long ?longitude' +
	    	'  } ' +
	    	'} LIMIT 1 ';
    	
        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };

        // This handler is for the additional queries.
        var endpoint = new AdvancedSparqlService(endpointConfig);

        
        function getPopover(id) {
        	var qry = prefixes + queryForPopover;
            var constraint = 'VALUES ?id2 { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
            	return result[0];
            });
        }
        
        function getPlacePopover(id) {
        	var regex = /^[^/]+$/;
        	if (regex.test(id)) { id = 'http://ldf.fi/nbf/places/'+id; }
    	
        	id = id.replace('/www.ldf.fi/', '/ldf.fi/');
        	var constraint = 'VALUES ?id { <' + id + '> } . ';
        	var qry = prefixes + queryForPlacePopover.replace('<RESULT_SET>', constraint);
        	return endpoint.getObjectsNoGrouping(qry)
            .then(function(result) {
            	return result[0];
            });
        }
        
        function getHrefPopover(href) {
            var constraint = 'VALUES ?href { "' + href + '" } ';
            return endpoint.getObjectsNoGrouping(prefixes + queryForHref.replace('<RESULT_SET>', constraint))
            .then(function(result) {
            	return result[0];
            });
        }
        
        function getPopoverGroup(arr) {
        	var ids = arr.map(function(st) {
        		if (st.match(/^p[0-9_]+$/)) {
        			// 	st is identifier 'p1234_5'
        			return 'nbf:'+st;
        		} 
        		// st is full url 'http://ldf.fi/nbf/p1234_5'
        		return '<'+st+'>';
        	}).join(' ');
        	
            var constraint = 'VALUES ?id2 { ' + ids + ' } . ';
            var qry = prefixes + queryForPopoverGroup.replace('<RESULT_SET>', constraint);
            
            return endpoint.getObjectsNoGrouping(qry)
            .then(function(result) {
            	return result;
            });
        }
        
        function getPopoverPairs(arr) {
        	var ids = arr.map(function(st, i) {
        		st = st.match(/^p[0-9_]+$/) ? 'nbf:'+st : '<'+st+'>';
        		return '('+st+' '+i+')';
        	}).join(' ');
        	
        	var constraint = 'VALUES (?id2 ?no) { ' + ids + ' } . ';
            var qry = prefixes + queryForPopoverPairs.replace('<RESULT_SET>', constraint);
            
            return endpoint.getObjectsNoGrouping(qry)
            .then(function(result) {
            	return result;
            });
        }
     
    }
})();
