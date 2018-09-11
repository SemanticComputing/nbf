(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('biographyService', biographyService);

    /* @ngInject */
    function biographyService($q, $sce, SPARQL_ENDPOINT_URL,
            AdvancedSparqlService, personMapperService) {

        /* Public API */

        // Get the details of a single bio.
        this.getBio = getBio;
        this.getNlpBio = getNlpBio;
        
        /* Implementation */

        var prefixes =
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX schema: <http://schema.org/> ' +
        ' PREFIX sources:	<http://ldf.fi/nbf/sources/> ' +
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
        ' PREFIX gvp: <http://vocab.getty.edu/ontology#> ';
        
        var prefixesNLP = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
    	'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
    	'PREFIX dct: <http://purl.org/dc/terms/> ' +
    	'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
    	'PREFIX nif: <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#> ' +
    	'PREFIX bd: <http://ldf.fi/nbf/biography/data#> ';
        
        // The query for the results.
        // ?id is bound to the person URI.
        var query =
            'SELECT DISTINCT * WHERE {' +
            ' { <RESULT_SET> }' +
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

        var queryNLP = 
        	'SELECT ?word ?x ?y ?z WHERE { ' +
        	'  	?structure bd:bioId <RESULT_SET> . ' +
        	'	?s nif:structure ?structure ; ' +
        	'		rdf:type nif:Sentence ; ' +
        	'		dct:isPartOf ?paragraph ; ' +
        	'        nif:order ?seo . ' +
        	'         ' +
        	'  	?w nif:sentence ?s ; ' +
        	'       <http://ufal.mff.cuni.cz/conll2009-st/task-description.html#ID> ?k . ' +
        	'	?paragraph bd:order ?i . ' +
        	'    OPTIONAL { ' +
        	'        ?w <http://ufal.mff.cuni.cz/conll2009-st/task-description.html#WORD> ?word . ' +
        	'	} OPTIONAL { ' +
        	'            ?w dct:isPartOf ?ne . ' +
        	'            ?ne bd:namedEntityType ?type ; ' +
        	'                nif:isString ?string ; ' +
        	'                nif:beginIndex ?begin ; ' +
        	' ' +
        	'                nif:endIndex ?end . ' +
        	'            ?ne bd:usedNeMethod ?ned . ' +
        	'            ?ne bd:primary 1 . ' +
        	'            ?ned bd:score ?score . ' +
        	'        } ' +
        	'      BIND(xsd:integer(?i)-1 AS ?x) ' +
        	'      BIND(xsd:integer(xsd:decimal(STR(?seo)))-1 AS ?y) ' +
        	'      BIND(xsd:integer(?k)-1 AS ?z) ' +
        	'} ORDER BY asc(?x) asc(?y) asc(?z) ';
        	
        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };
        
        var endpointConfig2 = {
                'endpointUrl': 'https://ldf.fi/nbf-nlp/sparql',
                'usePost': true
            };
        
        var endpoint = new AdvancedSparqlService(endpointConfig, personMapperService),
        	endpoint2 = new AdvancedSparqlService(endpointConfig2, personMapperService);
        
        function getBio(id) {
            var qry = prefixes + query;
            var constraint = 'VALUES ?bio { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(data) {
            	
            	var bio = data[0];
	        	
	        	if (bio.description) bio.description = $sce.trustAsHtml(bio.description);
                if (bio.source_paragraph) bio.source_paragraph = $sce.trustAsHtml(bio.source_paragraph);
                if (bio.lead_paragraph) bio.lead_paragraph = $sce.trustAsHtml(bio.lead_paragraph);
                if (bio.spouse_paragraph) bio.spouse_paragraph = $sce.trustAsHtml(bio.spouse_paragraph);
                
                return bio;
            });
        }
        
        function getNlpBio(id) {
            var qry = prefixesNLP + queryNLP;
            var constraint = ' <' + id + '> ';

            return endpoint2.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(res) {
            	
            	var data = [],
            		prev = "",
            		quoted = false;
            	
            	res.forEach(function(ob) {
            		var x=parseInt(ob.x), y=parseInt(ob.y), z=parseInt(ob.z);
            		
            		//	new paragraph
            		if (!data[x]) data[x] = [];
            		
            		//	new sentence
            		if (!data[x][y]) {
            			data[x][y] = [];
            			prev="";
            			quoted = false;
            		}
            		
            		//	by default a space before word
            		ob.space = true;
            		
            		//	assume undefined is embash
            		if (!ob.word) { ob.word="–"; 
	            		// no space in case 1883– or IV–
	            		if (RegExp('[0-9IVXLCDM.]').test(prev)) ob.space = false;
            		}
            		
            		
            		if (RegExp('&quot;').test(ob.word)) {
            			ob.word = ob.word.replace("&quot;",'"');
            			quoted = !quoted;
            			ob.space = quoted;
            		}
            			
            		if (RegExp("[&']").test(ob.word)) console.log(ob); 
            		
            		// no space in case –1942 or –VII
            		if (prev=="–" && RegExp('^[0-9IVXLCDM]').test(ob.word)) { ob.space = false; }
            		
            		// no space before . , : ; ! ? ) ] } "
            		if (ob.word && RegExp('^[.,:;=!?)}%]').test(ob.word)) ob.space = false;
            		else {
            			// no space after "
                		if (RegExp('"').test(prev)) ob.space = !quoted;
            		}
            		// no space after ( [ { 
            		if (RegExp('[({\[]').test(prev)) ob.space = false;
            		
            		
            		//	test different cases
            		
            		
            		//	todo word="&quot;"
            		
            		
            		/*
            		 tammi <UNDEFINED> helmikuussa
            		 Lauriksi <UNDEFINED> isä (ajatusviiva)
            		 15. <UNDEFINED> 16.1.1925
            		 */
            		
            		data[x][y].push(ob);
            		
            		prev= (ob.word ? ob.word.slice(-1) : "");
            	});

            	return data;
            });
        }
        /*
        function updateSortBy(sortBy) {
            var sort = $location.search().sortBy || '?ordinal';
            if (sort === sortBy) {
                $location.search('desc', $location.search().desc ? null : true);
            }
            $location.search('sortBy', sortBy);
        }
        */
    }
})();
