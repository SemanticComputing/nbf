(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('mapService', mapService);

    /* @ngInject */
    function mapService($q, // $location, _, 
    		SPARQL_ENDPOINT_URL,
            AdvancedSparqlService, personMapperService) {

        /* Public API */

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
        	'SELECT DISTINCT ?givenName ?familyName ?relative ?class ?id ?time__start ?time__end ?time__label ?time__span  ?label ?place__uri ?place__latitude ?place__longitude ?place__name   ' +
        	'WHERE { ' +
        	'  { ' +
        	'  { <RESULT_SET> }    ' +
        	'  ?pc a nbf:PersonConcept ;        ' +
        	'      foaf:focus ?prs ;   		 ' +
        	'      skosxl:prefLabel ?ilabel . ' +
        	'   ' +
        	'  { ?id crm:P100_was_death_of ?prs . } ' +
        	'  UNION   { ?id crm:P98_brought_into_life ?prs . } ' +
        	'  UNION   { ?id bioc:inheres_in ?prs . } ' +
        	'  ' +
        	'  ?id a/skos:prefLabel ?class .  ' +
        	'  FILTER (lang(?class)="en") ' +
        	'   ' +
        	'  ?id nbf:time ?time . 		 ' +
        	'  OPTIONAL { ?time gvp:estStart ?time__start. }   		 ' +
        	'  OPTIONAL { ?time gvp:estEnd ?time__end. }   		 ' +
        	'  OPTIONAL { ?time skos:prefLabel ?time__label. }    ' +
        	'   ' +
        	'  BIND ( CONCAT( ' +
        	'      IF(bound(?time__start),str(year(?time__start)),""), ' +
        	'      "-", ' +
        	'      IF(bound(?time__end),str(year(?time__end)),"") ' +
        	'    ) AS ?time__span) ' +
        	'   ' +
        	'  OPTIONAL { ?id skos:prefLabel ?label } ' +
        	'   ' +
        	'  OPTIONAL { ?id nbf:place ?place__uri .     	 ' +
        	'    ?place__uri geo:lat ?place__latitude ;             ' +
        	'                geo:long ?place__longitude  ;    		 ' +
        	'                skos:prefLabel ?place__name .  }   ' +
        	'   ' +
        	'  OPTIONAL { ?ilabel schema:givenName ?givenName } ' +
        	'  OPTIONAL { ?ilabel schema:familyName ?familyName } ' +
        	'  } UNION { ' +
        	'      { <RESULT_SET> }    ' +
        	'  ?pc a nbf:PersonConcept ; ' +
        	'      bioc:has_family_relation ?id ; ' +
        	'      skosxl:prefLabel ?ilabel .    ' +
        	'   ' +
        	'  ?id bioc:inheres_in/owl:sameAs* ?relative . ' +
        	'  FILTER NOT EXISTS { ?relative owl:sameAs [] } ' +
        	'   ' +
        	'  OPTIONAL { ?ilabel schema:givenName ?givenName } ' +
        	'  OPTIONAL { ?ilabel schema:familyName ?familyName } ' +
        	'   ' +
        	'  ?id a/skos:prefLabel ?class .  ' +
        	'  FILTER (lang(?class)="en") ' +
        	'   ' +
        	'  ?id nbf:time ?time . 		 ' +
        	'  OPTIONAL { ?time gvp:estStart ?time__start. }   		 ' +
        	'  OPTIONAL { ?time gvp:estEnd ?time__end. }   		 ' +
        	'  OPTIONAL { ?time skos:prefLabel ?time__label. }   	     ' +
        	'  BIND ( CONCAT( ' +
        	'      IF(bound(?time__start),str(year(?time__start)),""), ' +
        	'      "-", ' +
        	'      IF(bound(?time__end),str(year(?time__end)),"") ' +
        	'    ) AS ?time__span) ' +
        	'   ' +
        	'  OPTIONAL { ?id skos:prefLabel ?label } ' +
        	'   ' +
        	'  OPTIONAL { ' +
        	'    VALUES ?class { "Child"@en "Son"@en "Daughter"@en  } ' +
        	'  	?relative foaf:focus/^crm:P98_brought_into_life/nbf:place ?place__uri .' +
        	'    ?place__uri geo:lat ?place__latitude ; ' +
        	'                geo:long ?place__longitude  ; ' +
        	'                skos:prefLabel ?place__name .  } ' +
        	'  } ' +
        	'} ORDER BY ?time__start DESC(?time__end) ';

        
        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };
        
        // This handler is for the additional queries.
        var endpoint = new AdvancedSparqlService(endpointConfig, personMapperService);
        
        function getEvents(id) {
            var constraint = 'VALUES ?idorg { <' + id + '> } . ?idorg owl:sameAs* ?pc . ',
            	qry = prefixes + query.replace(/<RESULT_SET>/g, constraint);
            
            return endpoint.getObjects(qry)
            .then(function(events) {
            	
                if (events.length) {
                    return events;
                }
                
                return $q.reject('Henkilöllä ei ole kartalla näytettäviä tapahtumia.');
            });
        }
        
        
    }
})();
