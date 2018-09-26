(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('sentenceService', sentenceService);

    /* @ngInject */
    function sentenceService($q, _, AdvancedSparqlService, FacetResultHandler, SPARQL_ENDPOINT_URL,
            mapfacetService, objectMapperService) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        this.getReferences = getReferences;
        this.getPersonName = getPersonName;
        this.getWordUsageResults = getWordUsageResults;
        this.getWordCount = getWordCount;
	this.getReferencesByDecade = getReferencesByDecade;
	this.getReferencingByDecade = getReferencingByDecade;
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = mapfacetService.getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;

        this.upos = [
            {
                key: 'VERB',
                label: 'Verbi'

            },
{
                key: 'NOUN',
                label: 'Substantiivi'

            },
            {
                key: 'ADJ',
                label: 'Adjektiivi'

            },
            {
                key: 'PROPN',
                label: 'Erisnimi'

            },
        ];

        /* Implementation */

        var prefixes =
            ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
            ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
            ' PREFIX dct: <http://purl.org/dc/terms/> ' +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
            ' PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
            ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ' +
            ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
            ' PREFIX gvp: <http://vocab.getty.edu/ontology#> ' +
            ' PREFIX nbf: <http://ldf.fi/nbf/> ' +
            ' PREFIX categories: <http://ldf.fi/nbf/categories/> ' +
            ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
            ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
            ' PREFIX conll: <http://ufal.mff.cuni.cz/conll2009-st/task-description.html#> ' +
            ' PREFIX nif: <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#> ' +
            ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
            ' PREFIX schema: <http://schema.org/> ' +
            ' PREFIX text: <http://jena.apache.org/text#> ';


	var formattedLinkQuery = prefixes +
	    'SELECT ?href {' +
	    '  BIND( <http://ldf.fi/nbf/$personId> as ?person)' +
	    '  ?person  nbf:formatted_link ?href .'+
	    '}';

        var personQuery = prefixes +
            'SELECT ?label {' +
            '  BIND( <http://ldf.fi/nbf/$personId> as ?id)' +
            '  ?id skosxl:prefLabel ?id__label . ' +
            '  OPTIONAL { ?id__label schema:familyName ?id__fname }  ' +
            '  OPTIONAL { ?id__label schema:givenName ?id__gname }  ' +
            '  BIND (CONCAT(COALESCE(?id__gname,"")," ",COALESCE(?id__fname,"")) AS ?label) ' +
            '}';


	var referencesQuery = prefixes +
	    'SELECT * {' +
	    '  BIND( <http://ldf.fi/nbf/$personId> as ?person)' +
	    '  ?source <http://ldf.fi/nbf/biography/data#docRef> ?person .' +
	    '  ?source dct:hasPart/dct:references ?target .' +
	    '  ?target  nif:isString ?target_string .' +
	    '  ?target <http://ldf.fi/nbf/biography/data#anchor_link> ?target_link .' +
	    '  ?target dct:isPartOf ?sentence .' +
	    '  ?word <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#sentence> ?sentence ;' +
	    '        <http://ufal.mff.cuni.cz/conll2009-st/task-description.html#WORD> ?string ;' +
	    '        <http://ufal.mff.cuni.cz/conll2009-st/task-description.html#UPOS> ?upos ;' +
	    '        <http://ufal.mff.cuni.cz/conll2009-st/task-description.html#ID> ?id ;' +
	    '        <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#structure> ?structure ;' +
	    '        <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#sentenceOrder> ?sID .' +
	    '  ?sentence dct:isPartOf ?paragraph .' +
	    '  ?paragraph <http://ldf.fi/nbf/biography/data#order> ?i .' +
	    '  BIND(xsd:integer(?id) as ?x)' +
	    '  BIND(xsd:decimal(STR(?sID)) as ?y)' +
	    '  BIND(xsd:integer(?i) as ?z)' +
	    '  BIND(REPLACE(STR(?target_link), "file:///tmp/data/nlp/", "") AS ?link)' +
	    '  SERVICE <http://ldf.fi/nbf/sparql> {' +
	    '    ?personUri nbf:formatted_link ?link .' +
	    '  }' +
	    '} ORDER BY ASC(?structure) ASC(?z) ASC(?y) ASC(?x)' ;

	var sentenceQuery = prefixes +
	    'SELECT * {' +
	    '  BIND( <file:///tmp/data/nlp/$person_formatted_link> as ?person)' +
	    '  ?target  <http://ldf.fi/nbf/biography/data#anchor_link> ?person .' +
	    '  ?target  nif:isString ?target_string .' +
	    '  ?target dct:isPartOf ?sentence .' +
	    '  ?word <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#sentence> ?sentence ;' +
	    '        <http://ufal.mff.cuni.cz/conll2009-st/task-description.html#WORD> ?string ;' +
	    '        <http://ufal.mff.cuni.cz/conll2009-st/task-description.html#UPOS> ?upos ;' +
	    '        <http://ufal.mff.cuni.cz/conll2009-st/task-description.html#ID> ?id ;' +
	    '        <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#structure> ?structure ;' +
	    '        <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#sentenceOrder> ?sID .' +
	    '  ?sentence dct:isPartOf ?paragraph .' +
	    '  ?paragraph dct:isPartOf/<http://ldf.fi/nbf/biography/data#docRef> ?personUri .' +
	    '  ?paragraph <http://ldf.fi/nbf/biography/data#order> ?i .' +
	    '  BIND(xsd:integer(?id) as ?x)' +
	    '  BIND(xsd:decimal(STR(?sID)) as ?y)' +
	    '  BIND(xsd:integer(?i) as ?z)' +
	    '  SERVICE <http://ldf.fi/nbf/sparql> {' +
	    '     ?personUri <http://www.w3.org/2008/05/skos-xl#prefLabel>/<http://www.w3.org/2004/02/skos/core#prefLabel> ?label_lang . '+
	    '     BIND (str(?label_lang) AS ?label)' +
	    '  }' +
	    '} ORDER BY ASC(?structure) ASC(?z) ASC(?y) ASC(?x)' ;

	var referencedByDecadeQuery = prefixes +
            ' SELECT DISTINCT ?year (COUNT(distinct ?id) AS ?count) { ' +
	    '  BIND( <file:///tmp/data/nlp/$person_formatted_link> as ?person)' +
	    '  ?target  <http://ldf.fi/nbf/biography/data#anchor_link> ?person .' +
	    '  ?target  nif:isString ?target_string .' +
	    '  ?source dct:hasPart/dct:references ?target .' +
	    '  ?source <http://ldf.fi/nbf/biography/data#docRef> ?id .' +
	    '  SERVICE <http://ldf.fi/nbf/sparql> { ' +
	    '    ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?birth . ' +
  	    '  }' +
            '  BIND (FLOOR(YEAR(?birth)/10)*10 AS ?year) ' +
            ' } GROUP BY ?year ORDER BY ?year ';

	var referencingByDecadeQuery = prefixes +
            ' SELECT DISTINCT ?year (COUNT(distinct ?id) AS ?count) { ' +
	    '  BIND( <http://ldf.fi/nbf/$personId> as ?person)' +
	    '  ?source <http://ldf.fi/nbf/biography/data#docRef> ?person .' +
	    '  ?source dct:hasPart/dct:references ?target .' +
	    '  ?target  nif:isString ?target_string .' +
	    '  ?target <http://ldf.fi/nbf/biography/data#anchor_link> ?target_link .' +
	    '  BIND(REPLACE(STR(?target_link), "file:///tmp/data/nlp/", "") AS ?link)' +
	    '  SERVICE <http://ldf.fi/nbf/sparql> { ' +
	    '    ?id nbf:formatted_link ?link .' +
	    '    ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?birth . ' +
  	    '  }' +
            '  BIND (FLOOR(YEAR(?birth)/10)*10 AS ?year) ' +
            ' } GROUP BY ?year ORDER BY ?year ';

        // The query for the results.
        // ?id is bound to the person URI.
        var query =
            ' SELECT DISTINCT ?id WHERE {' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
            ' }';

        var lemmaQry = prefixes +
            ' SELECT DISTINCT ?lemma (COUNT(?lemma) AS ?count) { ' +
            '  VALUES ?doc { <http://ldf.fi/nbf/$personId> } ' +
            '  ?word nif:structure/<http://ldf.fi/nbf/biography/data#docRef> ?doc . ' +
            '  ?word conll:UPOS "<UPOS>" . ' +
            '  ?word conll:LEMMA ?lemma . ' +
            '  FILTER(STRLEN(STR(?lemma))>2) ' +
            '  FILTER (regex(?lemma, "^[^\.]*$")) . ' +
            '  FILTER (regex(?lemma, "^[^\:]*$")) . ' +
            '  FILTER (regex(?lemma, "^[^\;]*$")) . ' +
            '  FILTER (regex(?lemma, "^[^\&]*$")) . ' +
            '  FILTER (regex(?lemma, "^[^\,]*$")) . ' +
            '  FILTER (regex(?lemma, ".*(?<![.])$")) . ' +
            ' } GROUP BY ?lemma ORDER BY DESC(?count) LIMIT 50';

	var lemmaCountQry = prefixes +
            ' SELECT  (SUM(xsd:integer(?cnt)) AS ?count) (SUM(xsd:integer(?verb)) AS ?verbCount) (SUM(xsd:integer(?adj)) AS ?adjCount) (SUM(xsd:integer(?noun)) AS ?nounCount) (SUM(xsd:integer(?pnoun)) AS ?pnounCount) { ' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
	    '  ?id a <http://ldf.fi/nbf/PersonConcept> .' +
            '  ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] . ' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id . ' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ;' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt ;' +
            '      <http://ldf.fi/nbf/biography/data#verbCount> ?verb ;' +
            '      <http://ldf.fi/nbf/biography/data#adjCount> ?adj ;' +
            '      <http://ldf.fi/nbf/biography/data#nounCount> ?noun ;' +
            '      <http://ldf.fi/nbf/biography/data#propnCount> ?pnoun .' +
            ' } ';

	var topTenResults = prefixes +
	    ' SELECT DISTINCT ?id ?name ?cnt { ' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
	    '  ?id a <http://ldf.fi/nbf/PersonConcept> .' +
	    '  ?id <http://www.w3.org/2004/02/skos/core#prefLabel> ?name . ' +
            '  ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] . ' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id .' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ;' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt .' +
            ' } ORDER BY DESC(xsd:integer(?cnt)) LIMIT 10' ;
	var topBottomResults = prefixes +
	    ' SELECT DISTINCT ?id ?name ?cnt { ' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
	    '  ?id a <http://ldf.fi/nbf/PersonConcept> .' +
	    '  ?id <http://www.w3.org/2004/02/skos/core#prefLabel> ?name . ' +
            '  ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] . ' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id .' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ;' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt .' +
            ' } ORDER BY ASC(xsd:integer(?cnt)) LIMIT 10' ;

	var topTopCatsResults = prefixes +
	    ' SELECT DISTINCT ?category (ROUND(SUM(xsd:integer(?cnt)) / COUNT(xsd:integer(?cnt))) AS ?count) (COUNT(xsd:integer(?cnt)) as ?lkm) {' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
	    '  ?id a <http://ldf.fi/nbf/PersonConcept> .' +
	    '  ?id <http://www.w3.org/2004/02/skos/core#prefLabel> ?name . ' +
            '  ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] . ' +
	    '  ?id foaf:focus/nbf:has_category ?cat .' +
	    '  ?cat skos:prefLabel ?category .' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id .' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ;' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt .' +
            ' } GROUP BY ?category ORDER BY DESC(?count) LIMIT 10' ;

	var topBottomCatsResults = prefixes +
	    ' SELECT DISTINCT ?category (ROUND(SUM(xsd:integer(?cnt)) / COUNT(xsd:integer(?cnt))) AS ?count) (COUNT(xsd:integer(?cnt)) as ?lkm){' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
	    '  ?id a <http://ldf.fi/nbf/PersonConcept> .' +
	    '  ?id <http://www.w3.org/2004/02/skos/core#prefLabel> ?name . ' +
            '  ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] . ' +
	    '  ?id foaf:focus/nbf:has_category ?cat .' +
	    '  ?cat skos:prefLabel ?category .' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id .' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ;' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt .' +
            ' } GROUP BY ?category ORDER BY ASC(?count) LIMIT 10' ;

        var docCountByLenQry = prefixes +
            ' SELECT DISTINCT ?year (ROUND(SUM(xsd:integer(?cnt)) / COUNT(xsd:integer(?cnt))) AS ?count) { ' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
            '  ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?birth . ' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id . ' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ; ' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt . ' +
            '  BIND (FLOOR(YEAR(?birth)/10)*10 AS ?year) ' +
            ' } GROUP BY ?year ORDER BY ?year ';

        var docCountByDecadeQry = prefixes +
            ' SELECT DISTINCT ?year (COUNT(distinct ?id) AS ?count) { ' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
            '  ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?birth . ' +
            '  BIND (FLOOR(YEAR(?birth)/10)*10 AS ?year) ' +
            ' } GROUP BY ?year ORDER BY ?year ';

        var nbfEndpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };

        var nlpEndpointConfig = {
            'endpointUrl': 'https://ldf.fi/nbf-nlp/sparql',
            'usePost': true
        };

        var facetOptions = {
            endpointUrl: nbfEndpointConfig.endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/PersonConcept>',
            constraint: '?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] .',
            preferredLang : 'fi',
            noSelectionString: '-- Ei valintaa --'
        };

        // This handler is for the additional queries.
        var endpoint = new AdvancedSparqlService(nlpEndpointConfig, objectMapperService);
        var nbfEndpoint = new AdvancedSparqlService(nbfEndpointConfig, objectMapperService);

        function getReferencesByDecade(facetSelections, id) {
            var self = this;
            return nbfEndpoint.getObjectsNoGrouping(formattedLinkQuery.replace('$personId',id)).then(function(results) {
		if(results.length > 0) {
            	    var qry = referencedByDecadeQuery.replace('$person_formatted_link', results[0].href);
            	    var promises = endpoint.getObjectsNoGrouping(qry);
		    console.log("promises",promises);
		    return promises;
		} else { return {}; }
            });
        }

	 function getReferencingByDecade(facetSelections, id) {
            var self = this;
            var qry = referencingByDecadeQuery.replace('$personId', id);
            var promises = endpoint.getObjectsNoGrouping(qry);
	    console.log("promises",promises);
	    return promises;
        }

	function getLenStatistics(facetSelections) {
            var qry = docCountByLenQry.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            return nbfEndpoint.getObjectsNoGrouping(qry);
        }

	// Returns list of sentences where the person is mentioned
        function getResults(facetSelections, id) {
            var self = this;
            return nbfEndpoint.getObjectsNoGrouping(formattedLinkQuery.replace('$personId',id)).then(function(results) {
		if(results.length > 0) {
                    var promises = {};
                    var uposQry = sentenceQuery.replace('$person_formatted_link', results[0].href);
                    promises = endpoint.getObjectsNoGrouping(uposQry);
                    return promises;
		} else { return {}; }
            });
        }

	 function getWordUsageResults(facetSelections, id) {
            var self = this;
	    console.log("getWordUsageResults");
            //var qry = query.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            //return nbfEndpoint.getObjectsNoGrouping(qry).then(function(results) {
            //return nbfEndpoint.getObjectsNoGrouping(formattedLinkQuery.replace('$personId',id)).then(function(results) {
                /*if (results.length > 10000) {
                    return $q.reject({
                        statusText: 'Tulosjoukko on liian suuri. Ole hyvä ja rajaa tuloksia suodittimien avulla'
                    });
                }*/
                var promises = {};
                //var topQry = topTenResults.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
                var uposQry = lemmaQry.replace('$personId', id);
		console.log(uposQry);
		console.log(self.upos);

                self.upos.forEach(function(upos) {
		console.log("upos", upos.key);
                    promises[upos.key] = endpoint.getObjectsNoGrouping(uposQry.replace(/<UPOS>/g, upos.key));
                //promises = endpoint.getObjects(uposQry);
		console.log("results", promises);
                });
		console.log("results", promises)
                return $q.all(promises);
           // });
        }

	function getPersonName(facetSelections, id) {
            var self = this;
            var promises = {};
            var topQry = personQuery.replace('$personId', id);

            promises = nbfEndpoint.getObjectsNoGrouping(topQry);
            console.log("person", promises);
            return promises;
        }

	 function getReferences(facetSelections, id) {
 	    var self = this;
            var promises = {};
            var uposQry = referencesQuery.replace('$personId', id);
            promises = endpoint.getObjectsNoGrouping(uposQry);
            return promises;
        }

	 function getWordCount(facetSelections) {
            var self = this;
            var promises = {};
            var qry = lemmaCountQry.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));

            promises = nbfEndpoint.getObjectsNoGrouping(qry);
	    console.log("lemmaStats",promises);
            return promises;
        }
	function getResultsTopCat(facetSelections) {
            var self = this;
            var promises = {};
            var topQry = topTopCatsResults.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));

            promises = nbfEndpoint.getObjectsNoGrouping(topQry);
	    console.log(promises);
            return promises;
        }
	 function getResultsBottomCat(facetSelections) {
            var self = this;
            var promises = {};
            var topQry = topBottomCatsResults.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));

            promises = nbfEndpoint.getObjectsNoGrouping(topQry);
	    console.log(promises);
            return promises;
        }

        function getFacetOptions() {
            return angular.copy(facetOptions);
        }

    }
})();
