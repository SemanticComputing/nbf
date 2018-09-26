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
        
        this.getAuthors = getAuthors;
        this.getByAuthor = getByAuthor;
        this.getAuthoredBios = getAuthoredBios;
        this.getBios = getBios;
        this.getReferences = getReferences;
        this.getByReferences = getByReferences;
        this.getPerson = getPerson;
        this.getRelatives = getRelatives;
        this.getSimilar = getSimilar;
        
        //	init login
        this.getPortal = getPortal;
        
        /* Implementation */

        var prefixes =
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX schema: <http://schema.org/> ' +
        ' PREFIX sources:	<http://ldf.fi/nbf/sources/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
        ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ' +
        ' PREFIX nbf: <http://ldf.fi/nbf/> ' +
        ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
        ' PREFIX categories:	<http://ldf.fi/nbf/categories/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX gvp: <http://vocab.getty.edu/ontology#> ' +
        ' PREFIX rels: <http://ldf.fi/nbf/relations/> ';

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
        // '  OPTIONAL { ?id nbf:kulsa ?kulsa . }' +
        '  OPTIONAL { ?id nbf:yo1853 ?yo1853 . }' +
        '  OPTIONAL { ?id schema:relatedLink ?kansallisbiografia . }' +
        '  OPTIONAL { ?id foaf:focus ?prs . ' +
        '  		OPTIONAL { ?prs ^crm:P98_brought_into_life/nbf:place/skos:prefLabel ?birthPlace } ' +
        '  		OPTIONAL { ?prs ^crm:P98_brought_into_life/nbf:time/skos:prefLabel ?birthDate . }' +
        '  		OPTIONAL { ?prs ^crm:P100_was_death_of/nbf:time/skos:prefLabel ?deathDate . }' +
        '  		OPTIONAL { ?prs ^crm:P100_was_death_of/nbf:place/skos:prefLabel ?deathPlace }' +
        '  		OPTIONAL { ?prs schema:gender ?gender . }' +
        '  		OPTIONAL { ?prs nbf:image [ schema:image ?images ; dct:source ?imagesources ] }' +
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
            '  	  OPTIONAL { ?plabel schema:givenName ?givenName . }' +
            '  	  OPTIONAL { ?plabel schema:familyName ?familyName . }' +
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
            '  OPTIONAL { ?id nbf:yo1853 ?yo1853 . }' +
            '  OPTIONAL { ?id schema:relatedLink ?kansallisbiografia . }' +
            '  OPTIONAL { ?idorg (owl:sameAs*|^owl:sameAs+)/dct:source/skos:prefLabel ?source . }' +
            /*
            '  OPTIONAL { { ?id bioc:has_family_relation [ ' +
            '  		bioc:inheres_in ?rel ; ' +
            '  		a/skos:prefLabel ?relative__type ] . } ' +
            '		UNION { ?rel bioc:has_family_relation [ ' +
            '  		bioc:inheres_in ?id ; ' +
            '  		bioc:inverse_role/skos:prefLabel ?relative__type ] . } ' +
            '		?rel owl:sameAs* ?relative__id . ' +
            '		FILTER NOT EXISTS { ?relative__id owl:sameAs [] } ' +
            '		' +
            '  		FILTER (LANG(?relative__type)="fi") ' +
            '  		?relative__id skosxl:prefLabel ?relative__label . ' +
            '  		OPTIONAL { ?relative__label schema:familyName ?relative__familyName } ' +
            '  		OPTIONAL { ?relative__label schema:givenName ?relative__givenName } ' +
            '  		BIND (REPLACE(CONCAT( COALESCE(?relative__givenName,"") ," ", COALESCE(?relative__familyName,"")),"[(][^)]+[)]\\\\s*","") AS ?relative__name)  ' + 
            '  } ' +
            */
            '  OPTIONAL { ?id foaf:focus ?prs . ' +
            '  		OPTIONAL { ?prs ^crm:P98_brought_into_life ?bir . ' +
            '  			OPTIONAL { ?bir nbf:place ?birth__id . ?birth__id skos:prefLabel ?birth__label } ' +
            '  			OPTIONAL { ?bir nbf:time/skos:prefLabel ?birthDate }' +
            '		} ' +
            '  		OPTIONAL { ?prs ^crm:P100_was_death_of ?dea . ' +
            '			OPTIONAL { ?dea nbf:time/skos:prefLabel ?deathDate }' +
            '  			OPTIONAL { ?dea nbf:place ?death__id . ?death__id skos:prefLabel ?death__label }' +
            '		} ' +
            '  		OPTIONAL { ?prs nbf:image [ schema:image ?images ; dct:source ?is ] ' +
            '			OPTIONAL { ?is skos:prefLabel ?il } ' +
            '			BIND (COALESCE(?il, ?is) AS ?imagesources ) ' +
            '			}' +
            '  		OPTIONAL { ?prs ^bioc:inheres_in ?occupation_id . ' +
            '  			?occupation_id a nbf:Occupation ; skos:prefLabel ?occupation }' +
            '  		OPTIONAL { ?prs nbf:has_category ?category . }'  +
            '  }' +
            ' }';
        
        //	http://yasgui.org/short/SJL3C8Iv7
        var relativeQuery =
        	'SELECT DISTINCT ?type (?relative__id AS ?id2) ?name  ' +
        	'WHERE { <RESULT_SET>  ' +
        	'  VALUES (?class ?order) { ' +
        	'    ( rels:Father 0) ' +
        	'    ( rels:Mother 1) ' +
        	'    ( rels:Parent 2) ' +
        	'    ( rels:Spouse 3) ' +
        	'    ( rels:Child 4) ' +
        	'    ( rels:Daughter 4) ' +
        	'    ( rels:Son 4 ) }  ' +
        	'  { ?id bioc:has_family_relation [  ' +
        	'        bioc:inheres_in ?rel ; ' +
        	'        a ?class ; ' +
        	'        a/skos:prefLabel ?type ] .  ' +
        	'  } UNION  ' +
        	'  { ?rel bioc:has_family_relation [  ' +
        	'        bioc:inheres_in ?id ;  ' +
        	'        a ?class ; ' +
        	'        bioc:inverse_role/skos:prefLabel ?type ] .  ' +
        	'  }  ' +
        	'  FILTER (LANG(?type)="fi")  ' +
        	'  ?rel owl:sameAs* ?relative__id .  ' +
        	'  FILTER NOT EXISTS { ?relative__id owl:sameAs [] }  ' +
        	'  ?relative__id skosxl:prefLabel ?relative__label .  ' +
        	'  OPTIONAL { ?relative__label schema:familyName ?relative__familyName }  ' +
        	'  OPTIONAL { ?relative__label schema:givenName ?relative__givenName }  ' +
        	'  BIND (REPLACE(CONCAT( COALESCE(?relative__givenName,"") ," ", COALESCE(?relative__familyName,"")),"[(][^)]+[)]\\\\s*","") AS ?name)  ' +
        	'  OPTIONAL { ?relative__id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?btime } ' +
        	'} ORDER BY ?order ?btime ';
        
        var bioQuery =
            'SELECT DISTINCT * WHERE {' +
            ' { <RESULT_SET> }' +
            ' ?id owl:sameAs*|^owl:sameAs ?prs .' +
            ' ?prs foaf:focus/nbf:has_biography ?bio .' +
            '  OPTIONAL { ?bio dct:source ?source . ?source skos:prefLabel ?database }' + /* MOVED TO biography.service.js
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
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "7"^^xsd:integer ; nbf:content ?source_paragraph ] }' + */
            '} ORDER BY str(?source)';


        //	http://yasgui.org/short/HyNJegbGQ
        var querySimilar = 
            'SELECT DISTINCT (GROUP_CONCAT(DISTINCT(?prs); separator=",") as ?people) (COUNT(DISTINCT ?prs) AS ?count) ' +
        	'WHERE { ' +
        	'  { <RESULT_SET> } ' +
        	'  ?dst a nbf:Distance ; ' +
        	'        bioc:relates_to ?id, ?prs ; ' +
        	'        nbf:value ?value . ' +
        	'  FILTER (?prs!=?id)  ' +
        	//'  OPTIONAL { ?prs skosxl:prefLabel/schema:familyName ?fname . } ' +
        	//'  OPTIONAL { ?prs skosxl:prefLabel/schema:givenName ?gname . }  ' +
        	//'  BIND (CONCAT(COALESCE(?gname, "")," ",COALESCE(?fname, "")) AS ?label) ' +
        	'} ORDER BY DESC(?value) LIMIT 16 ';
        
        //	
        var queryAuthors = 
        	'SELECT DISTINCT (GROUP_CONCAT(DISTINCT(?author); separator=",") as ?people) (COUNT(DISTINCT ?id) AS ?count) WHERE {' +
        	'  <RESULT_SET>' +
        	'  ?id owl:sameAs*|^owl:sameAs ?prs . ' +
        	'  ?prs foaf:focus/nbf:has_biography/schema:author ?author . ' +
        	'}  ';
        
        //	http://yasgui.org/short/ByvETV0xm
        var queryByAuthor =
        	'SELECT (GROUP_CONCAT(DISTINCT(?id); separator=",") as ?people) (COUNT(DISTINCT ?id) AS ?count) WHERE {' +
        	'  { ' +
        	'  SELECT DISTINCT ?author ?id2 ?prs2 ' +
        	'    WHERE { ' +
        	'        <RESULT_SET> ' +
        	'        ?id2 owl:sameAs*|^owl:sameAs ?prs2 . ' +
        	'        ?prs2 foaf:focus/nbf:has_biography/nbf:authors ?author . ' +
        	'    } ' +
        	'  } ' +
        	'  ?prs foaf:focus/nbf:has_biography/nbf:authors ?author . ' +
        	'  ?prs owl:sameAs* ?id . ' +
        	'  FILTER NOT EXISTS {?id owl:sameAs []} ' +
        	'  FILTER (?id != ?prs2 && ?id != ?id2) ' +
        	'} ';
        
        var queryAuthoredBios =
        	'SELECT DISTINCT (GROUP_CONCAT(DISTINCT(?id); separator=",") as ?people) (COUNT(DISTINCT ?id) AS ?count) WHERE ' +
        	'  { <RESULT_SET> ' +
        	'  ?id foaf:focus/nbf:has_biography/schema:author ?author . ' +
        	'  } ' ;
        
        //	http://yasgui.org/short/BJ4f20xYX
        var queryReferences = 
        	'SELECT (GROUP_CONCAT(DISTINCT(?id); separator=",") as ?people) (COUNT(DISTINCT ?id) AS ?count) WHERE { ' +
        	' <RESULT_SET> ' +
        	'   ?id2 nbf:formatted_link ?target . ' +
        	'  BIND (URI(CONCAT("file:///tmp/data/nlp/",?target)) AS ?target_link) ' +
        	'  SERVICE <http://ldf.fi/nbf-nlp/sparql> { ' +
        	'   ?par <http://purl.org/dc/terms/references>/<http://ldf.fi/nbf/biography/data#anchor_link> ?target_link ; ' +
        	'        dct:isPartOf/<http://ldf.fi/nbf/biography/data#docRef> ?id . ' +
        	' } ' +
        	'} ';
        
        //	NOTE this queries for persons references in current biography
        //	not used on the person page
        //	http://yasgui.org/short/ByNkfgYK7
        var queryByReferences =
        	'SELECT (GROUP_CONCAT(DISTINCT(?id); separator=",") as ?people) (COUNT(DISTINCT ?id) AS ?count) WHERE {   ' +
        	' <RESULT_SET> ' +
        	'  SERVICE <http://ldf.fi/nbf-nlp/sparql> {     ' +
        	'    ?par <http://purl.org/dc/terms/isPartOf>/<http://ldf.fi/nbf/biography/data#docRef> ?id2 ;      			 ' +
        	'         <http://purl.org/dc/terms/references>/<http://ldf.fi/nbf/biography/data#anchor_link> ?target_link .      ' +
        	'    BIND(REPLACE(STR(?target_link),".*?(kb/artikkeli/\\\\d+/)","$1") as ?target) ' +
        	'  } ' +
        	'  ?id nbf:formatted_link ?target .  ' +
        	'} ';
        
        var queryPortal = 'SELECT * WHERE { ?x ?y ?z } LIMIT 1 ';
        
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
        	var res = resultHandler.getResults(facetSelections, getSortBy());
            return res;
        }
        
        function getPerson(id) {
        	
        	var regex = /^p[0-9]+$/;
        	if (regex.test(id)) { id = 'http://ldf.fi/nbf/'+id; }
        	
            var qry = prefixes + detailQuery;
            var constraint = 'VALUES ?idorg { <' + id + '> } . ?idorg owl:sameAs* ?id . FILTER NOT EXISTS { ?id owl:sameAs [] } ';
            
            return endpoint.getObjects(qry.replace('<RESULT_SET>', constraint))
            .then(function(person) {
            	if (person.length) {
                    return person[person.length-1];
                }
                return $q.reject('Not found');
            });
        }

        function getBios(id) {
        	
        	var constraint = 'VALUES ?id { <' + id + '> } . ';
        	
            var qry = prefixes + bioQuery.replace('<RESULT_SET>', constraint);
            
            return endpoint.getObjectsNoGrouping(qry)
            .then(function(result) {
                return result;
            });
        }

        function getRelatives(id) {
        	var qry = prefixes + relativeQuery;
            var constraint = 'VALUES ?idorg { <' + id + '> } . ?idorg owl:sameAs* ?id . FILTER NOT EXISTS { ?id owl:sameAs [] } ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint));
        }
        
        function getSimilar(id) {
            var qry = prefixes + querySimilar;
            var constraint = 'VALUES ?id { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
                return result;
            });
        }

        function getAuthors(id) {
        	var constraint = 'VALUES ?id { <' + id + '> } . ';
            var qry = prefixes + queryAuthors.replace('<RESULT_SET>', constraint);
            return endpoint.getObjectsNoGrouping(qry);
        }
        
        function getByAuthor(id) {
        	var constraint = 'VALUES ?id2 { <' + id + '> } . ';
            var qry = prefixes + queryByAuthor.replace('<RESULT_SET>', constraint);
            return endpoint.getObjectsNoGrouping(qry);
        }

        function getAuthoredBios(id) {
        	var constraint = 'VALUES ?prs { <' + id + '> } . ?prs (owl:sameAs*|^owl:sameAs*) ?author . ';
            var qry = prefixes + queryAuthoredBios.replace('<RESULT_SET>', constraint);
            return endpoint.getObjectsNoGrouping(qry);
        }
        
        function getByReferences(id) {
        	var constraint = 'VALUES ?id2 { <' + id + '> } . ';
        	var qry = prefixes + queryByReferences.replace('<RESULT_SET>', constraint);
            return endpoint.getObjectsNoGrouping(qry);
        }
        
        function getReferences(id) {
        	var constraint = 'VALUES ?id2 { <' + id + '> } . ';
        	var qry= prefixes + queryReferences.replace('<RESULT_SET>', constraint);
        	return endpoint.getObjectsNoGrouping(qry);
        }
        
        function getPortal() {
        	return endpoint.getObjectsNoGrouping(prefixes+queryPortal)
        		.then(function(result) { return result; });
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
