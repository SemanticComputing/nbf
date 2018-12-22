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
        	' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
        	' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX schema: <http://schema.org/> ' +
        ' PREFIX sources:	<http://ldf.fi/nbf/sources/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
        ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ' +
        ' PREFIX nbf: <http://ldf.fi/nbf/> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX categories:	<http://ldf.fi/nbf/categories/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX gvp: <http://vocab.getty.edu/ontology#> ';
        
        var prefixesNLP = 	'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        'PREFIX bd: <http://ldf.fi/nbf/biography/data#> ' +
        'PREFIX dct: <http://purl.org/dc/terms/> ' +
        'PREFIX nif: <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#> ' +
    	'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
    	'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
    	'PREFIX ufal: <http://ufal.mff.cuni.cz/conll2009-st/task-description.html#> ' +
    	'PREFIX nbfbiodata: <http://ldf.fi/nbf/biography/data#>  ' +
    	'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
    	'PREFIX biog: <http://ldf.fi/nbf/biography/> ';
        
        // The query for the results.
        var query =
            'SELECT DISTINCT * WHERE {' +
            ' { <RESULT_SET> }' +
            ' OPTIONAL { ?bio dct:source ?source . ?source skos:prefLabel ?database }' +
            ' OPTIONAL { ?bio nbf:authors ?author_text }' +
            ' OPTIONAL { ?bio schema:dateCreated ?created }' +
            ' OPTIONAL { ?bio schema:dateModified ?modified }' +
            ' OPTIONAL { ?bio schema:relatedLink ?link }'  +
            ' OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "0"^^xsd:integer ; nbf:content ?lead_paragraph ] }' +
            ' OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "1"^^xsd:integer ; nbf:content ?description    ] }' +
            ' OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "2"^^xsd:integer ; nbf:content ?family_paragraph ] }' +
            ' OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "3"^^xsd:integer ; nbf:content ?parent_paragraph ] }' +
            ' OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "4"^^xsd:integer ; nbf:content ?spouse_paragraph ] }' +
            ' OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "5"^^xsd:integer ; nbf:content ?child_paragraph  ] }' +
            ' OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "6"^^xsd:integer ; nbf:content ?medal_paragraph  ] }' +
            ' OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "7"^^xsd:integer ; nbf:content ?source_paragraph ] }' +
            '} ORDER BY str(?source)';
        
        //	http://yasgui.org/short/O7Rul_hHW
        var queryNLP =
        	'SELECT DISTINCT ?x ?y ?z ?word ?parag_value  ' +
        	' (SAMPLE(?ne__types) AS ?ne__type) (SAMPLE(?ne__urls) AS ?ne__url) ' +
        	'WHERE { ' +
        	'  VALUES ?id { <RESULT_SET> } ' +
        	'  ?struc nbfbiodata:docRef ?id ; ' +
        	'      dct:hasPart ?parag .  ' +
        	'  ?parag nif:isString ?parag_value .  ' +
        	'  ?parag nbfbiodata:order ?parag_str .  ' +
        	'  BIND (xsd:integer(xsd:decimal(?parag_str))-2 AS ?x)  ' +
        	'  ?sent dct:isPartOf ?parag ; ' +
        	'      nif:order ?sent_str . ' +
        	'  BIND (xsd:integer(xsd:decimal(?sent_str))-1 AS ?y) ' +
        	'  ?w nif:sentence ?sent ; ' +
        	'     ufal:ID ?w_str . ' +
        	'  BIND (xsd:integer(?w_str)-1 AS ?z)  ' +
        	'  OPTIONAL { ?sent nbfbiodata:hasNamedEntity ?nes . ' +
        	'    ?nes nif:beginIndex ?ne__begin ; ' +
        	'       nif:endIndex ?ne__end . ' +
        	'    FILTER (?ne__begin<=?z +1 && ?z +1<=?ne__end ) ' +
        	'    ?neg <http://ldf.fi/nbf/biography/data#member> ?nes . ' +
        	'    ?nes nbfbiodata:namedEntityType ?ne__typeurl ;  ' +
        	'       skos:relatedMatch ?ne__urls . ' +
        	'    BIND (REPLACE(STR(?ne__typeurl), "^.*?([^/]+)$", "$1") AS ?ne__types) ' +
        	'  } ' +
        	'  OPTIONAL { ?w ufal:WORD ?word } ' +
        	'} GROUP BY ?x ?y ?z ?word ?parag_value ORDER BY ?x ?y ?z ';
        	
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
        
        function getNlpBio($scope) {
        	
        	var id = $scope.url.replace('nbf/bio','nbf/p');
        	var constraint = ' <' + id + '> ';
            var qry = prefixesNLP + queryNLP.replace('<RESULT_SET>', constraint);
            
            $scope.has_annotations = false;
            
            var typeclasses =  {
            		"PersonName": "personlink" ,
            		"PlaceName": "placelink" ,
		            "OrganizationName": "organizationlink" ,
		            "VocationName": false , // "vocationlink" ,
		            "AnonymEntity": false ,
		            "AddressName": false ,
		            "CorporationsName": false ,
		            "EducationalOrganization": false ,
		            "ExpressionTime": false ,
		            "GeographicalLocation": false ,
		            "PoliticalLocation": false ,
		            "PoliticalOrganization": false ,
		            "MediaOrganization": false ,
		            "CultureOrganization": false };
            
            return endpoint2.getObjectsNoGrouping(qry)
            .then(function(res) {
            	
            	var data = [],
            		prev = "",
            		prev_ob = null,
            		quoted = false;
            	
            	var strings = [], string="";
		var parag_value;
		var limit = 100;
            	
            	res.forEach(function(ob) {
			//ob.word = ob.word.trim()
            		var x=parseInt(ob.x), y=parseInt(ob.y), z=parseInt(ob.z);
            		
            		//	new paragraph
            		if (!data[x]) {
				data[x] = [];
				if (RegExp('^(URA.|TEOKSET.|Elokuvat:|Televisiosarjat:|TUOTANTO.|LÄHTEET JA KIRJALLISUUS.|MUUT LÄHTEET.)').test(ob.parag_value)){
					if (z < limit) limit = z;
				}
			}
            		
            		//	new sentence
            		if (!data[x][y]) {
            			data[x][y] = [];
            			prev="";
            			prev_ob = null;
            			quoted = false;
            			if (string) strings.push(string);
            			string = "";
            		}
            		
            		//	by default a space before word
            		ob.space = true;
            		
            		//	assume undefined is emdash
            		if (!ob.word) { ob.word="–"; 
	            		// no space in case 1883– or IV–
	            		if (RegExp('[0-9IVXLCDM.]').test(prev)) ob.space = false;
            		}
            		
            		
            		if (RegExp('&quot;').test(ob.word)) {
            			ob.word = ob.word.replace("&quot;",'"');
            			quoted = !quoted;
            			ob.space = quoted; 
            		}
            			
            		if (RegExp("[&']").test(ob.word)) { 
            			ob.word = ob.word
            				.replace('&amp;nbsp;', ' ')
            				.replace('&amp;gt', '>')
            				.replace('&amp;amp;', '&')
            				.replace('&amp;lt', '<')
					.trim(); 
            		}
            		
            		// no space in case –1942 or –VII
            		if (prev=="–" && RegExp('^[0-9IVXLCDM]').test(ob.word)) { ob.space = false; }
            		
            		//	TODO cases "Vaalikone poliittisena mediana // Politiikka 2/2004"
            		
            		// no space before . , : ; ! ? / ) ] } "
            		if (ob.word && RegExp('^[.,;:=!?/)}%]').test(ob.word)) { 
				ob.space = false; 
				//console.log('['+ob.word+']');
            		} else {
				//console.log('['+ob.word+']');
            			// no space after "
                		if (RegExp('"').test(prev)) ob.space = !quoted;
            		}
            		// no space after ( [ { /
            		if (RegExp('[/({\[]').test(prev)) ob.space = false;
            		
            		
            		
            		//	test if has a named entity link:
            		ob.class = false;
            		if (ob.ne && ob.ne.type && ob.ne.url) {
				//ob.nes = true;
            			if (typeclasses[ob.ne.type]!=false) {
					if ( (limit <= z && ob.ne.type == "PersonName")) {
						console.log("Skipped: "+ob.ne+ ", "+ob.word);
					} else {
            				ob[typeclasses[ob.ne.type]] = ob.ne.url;
            				ob.class = true;
					ob.nes = true;

            				//	merge following object with same link: 'Lauri'+'Törni'='Lauri Törni'
            				if (prev_ob && prev_ob[typeclasses[ob.ne.type]] == ob.ne.url) {
            					prev_ob.word += (ob.space ? ' ' : '')+ob.word; 
            					prev = (ob.word ? ob.word.slice(-1) : "");
            					ob = null;
            				}
            				
            				$scope.has_annotations = true;
            				}
            			}
            		}
            		
            		
            		if (ob) {
            			data[x][y].push(ob);
            			
            			string += (prev_ob && ob.space ? ' ' : '')+ob.word;
            			
            			prev = (ob.word ? ob.word.slice(-1) : "");
            			prev_ob = ob;
            		}
            	});
            	// console.log('DATA:'+data);
            	return data;
            });
        }
        
    }
})();
