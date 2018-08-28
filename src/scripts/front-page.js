    /*function inLanguage(lan) {
    	language = lan; // en or fi
        if (language == "fi") {
            strings = finnishStrings;
        } else if (language == "en") {
            strings = englishStrings;
        }
       // var langLink = "<li><a href='/" + otherLocale + "/'><span class='glyphicon glyphicon-globe' aria-hidden='true'></span> " + strings["localeLinkText"] + "</a></li>";
       alert("Done");
        $("#nav").load("page-templates/navbar-"+ language + ".html.partial", function() {
            $(".navbar-nav:first-child").append(langLink);
        });
    } */

//	TODO: move the functionality from this file into controller at scripts/portal.controller.js
(function($) {
/* ==========================================================================
   Code for generating language dependent strings for the WarSampo.fi service front page.
   ========================================================================== */

    var finnishStrings = {
        pageTitle: "Semanttinen kansallisbiografia",
        jumboTitle: "Semanttinen kansallisbiografia",
        jumboSubtitle: "Suomalaisten elämäkertojen verkosto semanttisessa webissä",
        generalDesc: "Sovellus mahdollistaa suomalaisten historiallisten henkilöiden elämäkertojen ja henkilöryhmien tutkimisen " +
        		"toisiinsa linkitettyjen laajojen tietoaineistojen avulla.",
        ins: "ohje",
        followFacebook: "Liity Semanttinen kansallisbiografia -ryhmään Facebookissa",
        localeLinkText: "In English",
        choosePerspective: "Valitse sovellusnäkymä aineistoihin",
        perspectiveTooltip: "Klikkaa käynnistääksesi sovellus",
        searchH: "Hae ja selaa",
        searchP: "Etsi elämäkertoja joustavasti eri näkökulmista",
        mapsH: "Kartat",
        mapsP: "Elämäkerrat kartalla",
        statisticsH: "Tilastot",
        statisticsP: "Ryhmien elämäntarinat tilastojen kautta",
        networksH: "Verkostot",
        networksP: "Tutki historiallisten henkilöiden verkostoja",
        relationsH: "Yhteyshaku",
        relationsP: "Hae henkilöiden ja paikkojen välisisä yhteyksiä",
        casultiesH: "Kielianayysi",
        casultiesP: "Tutki elämäkerttoissa käytetttyä kieltä",
        
        /*
        photographsH: "Valokuvat",
        photographsP: "SA-kuva-arkiston valokuvien selaus fasettihaun avulla",
        cemeteriesH: "Sankarihautausmaat",
        cemeteriesP: "Suomen sankarihautausmaat valokuvin",
        examples: "Esimerkkisivuja",
        personExH: "Henkilö",
        personExP: "Kenraalimajuri Einar Vihma",
        unitExH: "Joukko-osasto",
        unitExP: "Lentolaivue 32",
        eventExH: "Tapahtuma",
        eventExP: "Taistelut alkoivat",
        photoExH: "Valokuva",
        photoExP: "Viipurin valtausparaati",
        imgCopyRightP: "Kuvat:",
        imgCopyRight: "SA-kuva",
        */
        metaDescription: "Sovelluksen avulla voi hakea, selata, visualisoida ja tutkia laajoja suomalaisiin historiallisiin henkilöihin liittyviä tietoaineistoja."
    };
    /*
    var englishStrings = {
        pageTitle: "WarSampo",
        jumboTitle: "WarSampo",
        jumboSubtitle: "Finnish World War II on the Semantic Web",
        generalDesc: "The WarSampo Portal enables both historians and laymen to study the war history and destinies of their family members in the war from different interlinked perspectives",
        followFacebook: "Join the WarSampo Facebook group",
        ins: "instructions",
        localeLinkText: "Suomeksi",
        choosePerspective : "Select a perspective to search and browse the WarSampo data",
        perspectiveTooltip: "Click to open the perspective",
        searchH: "Events",
        searchP: "Events of the Winter and Continuation War visualized using a timeline and a map with related linked data",
        mapsH: "maps",
        mapsP: "Data about maps with related links from various sources",
        statisticsH: "Army statistics",
        statisticsP: "Events and other related data about army statistics visualized using i.a. maps",
        networksH: "networks",
        networksP: "Search and browse networks and maps covering the war zone area in Finland and discover addional data such as events and photographs linked to places",
        relationsH: "Kansa taisteli magazine relations",
        relationsP: "Faceted semantic search and contextual reader for Kansa taisteli magazine relations containing mostly memoirs of soldiers related to WW2",
        casultiesH: "language",
        casultiesP: "A table-like view of war casualty records that can be filtered using faceted semantic search, enriched with links to other WarSampo datasets ",
        photographsH: "Photographs",
        photographsP: "Browse the content of the Finnish Wartime Photograph Archive with faceted search",
        cemeteriesH: "War Cemeteries",
        cemeteriesP: "War cemeteries of Finland with photographs",
        examples: "Example Pages",
        personExH: "Person",
        personExP: "Major General Einar Vihma",
        unitExH: "Army Unit",
        unitExP: "No. 32 Squadron",
        eventExH: "Event",
        eventExP: "Battles commenced",
        photoExH: "Photograph",
        photoExP: "Military parade celebrating the capture of Vyborg",
        imgCopyRightP: "Photos:",
        imgCopyRight: "Finnish Wartime Photograph Archive",
        metaDescription: "WarSampo lets you search, browse, and visualize large datasets regarding the Winter War, Continuation War, and Lapland War."
    };
	*/
    function getLanguage() {
    	return "fi";
    	/*
        var url = window.location.href;
        var pathArray = url.split("/");

        if (pathArray[3] == "en") {
            return "en";
        } else {
            return "fi";
        }*/
    }

    
    $(document).ready(function(){
        var strings;
        var language = getLanguage();

        // For localhost testing:
        language = "fi";
        
        if (language == "fi") {
            strings = finnishStrings;
        } else if (language == "en") {
            strings = englishStrings;
        }

        $('head').append('<meta name="Description" content="' + strings["metaDescription"] + '" />'); // eslint-disable-line quotes

        var otherLocale = language === "fi" ? "en" : "fi";
        /*
        var langLink = "<li><a href='/" + otherLocale + "/'><span class='glyphicon glyphicon-globe' aria-hidden='true'></span> " + strings["localeLinkText"] + "</a></li>";

        $("#nav").load("page-templates/navbar-"+ language + ".html.partial", function() {
            $(".navbar-nav:first-child").append(langLink);
        });
        */
        // $("#footer").load("page-templates/footer.html.partial");

        $("title").text(strings["pageTitle"]);
        $("#jumboTitle").text(strings["jumboTitle"]);
        $("#jumboSubtitle").text(strings["jumboSubtitle"]);
        $("#generalDesc").text(strings["generalDesc"]);
        $("#generalDesc").append(" (<a data-toggle='modal' data-target='#myModal' href='#'>" + strings["ins"] + "</a>).");
        $("#generalIns").text(strings["generalIns"]);
        $("#followFacebook").text(strings["followFacebook"]);
        $("#choosePerspective").text(strings["choosePerspective"]);
        $("#searchH").text(strings["searchH"]);
        $("#searchP").text(strings["searchP"]);
        $("#mapsH").text(strings["mapsH"]);
        $("#mapsP").text(strings["mapsP"]);
        $("#statisticsH").text(strings["statisticsH"]);
        $("#statisticsP").text(strings["statisticsP"]);
        $("#networksH").text(strings["networksH"]);
        $("#networksP").text(strings["networksP"]);
        $("#relationsH").text(strings["relationsH"]);
        $("#relationsP").text(strings["relationsP"]);
        $("#casultiesH").text(strings["casultiesH"]);
        $("#casultiesP").text(strings["casultiesP"]);
        /*
        $("#examples").text(strings["examples"]);
        $("#personExH").text(strings["personExH"]);
        $("#personExP").text(strings["personExP"]);
        $("#unitExH").text(strings["unitExH"]);
        $("#unitExP").text(strings["unitExP"]);
        $("#eventExH").text(strings["eventExH"]);
        $("#eventExP").text(strings["eventExP"]);
        $("#photoExH").text(strings["photoExH"]);
        $("#photoExP").text(strings["photoExP"]);
        $("#photographsH").text(strings["photographsH"]);
        $("#photographsP").text(strings["photographsP"]);
        $("#cemeteriesH").text(strings["cemeteriesH"]);
        $("#cemeteriesP").text(strings["cemeteriesP"]);
        $(".img-copyright").text(strings["imgCopyRightP"]);
        $(".img-copyright").append(" <a href='http://sa-kuva.fi'>" + strings["imgCopyRight"] +"</a>");

        $(".pers-link").attr("title", strings["perspectiveTooltip"]);
        */
        /*
        $("#events").attr("href", "/" + language + "/events/" );
        $("#maps").attr("href", "/" + language + "/maps/" );
        $("#statistics").attr("href", "/" + language + "/statistics/" );
        $("#networks").attr("href", "/" + language + "/networks/" );
        $("#relations").attr("href", "/" + language + "/relations/" );
        $("#language").attr("href", "/" + language + "/language/" );
        $("#photographs").attr("href", "/" + language + "/photographs/" );
        $("#cemeteries").attr("href", "/" + language + "/cemeteries/" );
		
        ["#event-ex-link", "#person-ex-link", "#unit-ex-link", "#photo-ex-link"].forEach(function(id) {
            var elem = $(id);
            elem.attr("href", "/" + language + elem.attr("href"));
        });
		*/

    });
})(jQuery);
