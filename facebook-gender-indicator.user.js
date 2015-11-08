/**
 *
 * This is a Greasemonkey script and must be run using a Greasemonkey-compatible browser.
 *
 * @author rho
 */
// ==UserScript==
// @name           Gender Indicator for Facebook
// @version        0.2.0
// @updateURL      https://github.com/lph3/facebook-GenderIndicator/raw/master/facebook-gender-indicator.user.js
// @description    Lets the little popup card show your preferred name and gender
// @include		   https://www.facebook.com/*
// @grant          console.log
// @grant          GM_xmlhttpRequest
// @grant          GM_getValue
// @grant          GM_setValue
// ==/UserScript==


GENDER = {};

GENDER.user_ids = [];
GENDER.ellipsis = [];
GENDER.tableRows = [];
	
GENDER.CONFIG = {
	'debug': true, // switch to true to debug.
    'gdocs_key': '16EEZTDrHL4WQyDYAmG8S4nKrIYnyQbMhRO70fcDnWpQ',
	'gform_key': 'XXX',
	'gdocs_development_key': '16EEZTDrHL4WQyDYAmG8S4nKrIYnyQbMhRO70fcDnWpQ',
    'gform_development_key': 'XXX',
};

// Utility debugging function.
GENDER.log = function (msg) {
    if (!GENDER.CONFIG.debug) { return; }
    console.log('GENDER: ' + msg);
};

GENDER.init = function () {
    GENDER.user_database = GENDER.getValue('user_database', false);
    if (GENDER.userDatabaseExpired()) {
        GENDER.fetchUserDatabase();
    }
	
	// Make a list of known user IDs
	var parser = new DOMParser();
	var doc = parser.parseFromString(GENDER.user_database, 'text/html');
	GENDER.tableRows = doc.querySelectorAll('table.waffle td:nth-child(3)'); // third child is the column of IDs.
	for (var i = 2; i < GENDER.tableRows.length; i++) { // we never need the first (0'th) cell because Google provides it blank.
		GENDER.user_ids.push(GENDER.tableRows[i].innerHTML);
	}
	GENDER.log('recalled user ids ' + GENDER.user_ids);
	
	GENDER.log("init done");
	//document.getElementById("globalContainer").addEventListener('DOMNodeInserted', GENDER.searchDOM);
};
window.addEventListener('load', GENDER.init);

var target = document.querySelector('#globalContainer');
var config = { childList: true };

var observer = new MutationObserver(function(mutations) {
mutations.forEach(function(mutation) {
	GENDER.log(mutation.type);
	GENDER.searchDOM();
  });    
});
observer.observe(target, config);



// Determines whether the user database has expired and needs to be re-fetched.
GENDER.userDatabaseExpired = function () {
    // If we don't have a database, then of course it's "expired."
    if (!GENDER.user_database) {
        GENDER.log('User database expired because of false-equivalent value.');
        return true;
    } else if ( (new Date().getTime() > (parseInt(GENDER.getValue('last_fetch_time')) + 8)) ) {
        // User database was last fetched more than 24 hours (86400 seconds) ago, so refresh.
        GENDER.log('User database expired because of time.');
        return true;
    } else {
        GENDER.log('User database still fresh.');
        return false;
    }
};

GENDER.getDatabaseConnectionString = function () {
    return (GENDER.CONFIG.debug) ?
        GENDER.CONFIG.gdocs_development_key :
        GENDER.CONFIG.gdocs_key;
};
GENDER.getReportFormKey = function () {
    return (GENDER.CONFIG.debug) ?
        GENDER.CONFIG.gform_development_key :
        GENDER.CONFIG.gform_key;
};

GENDER.setValue = function (x, y) {
    return (GENDER.CONFIG.debug) ?
        GM_setValue(x += '_development', y) :
        GM_setValue(x, y);
};

GENDER.getValue = function (x, y) {
    if (arguments.length === 1) {
        return (GENDER.CONFIG.debug) ?
            GM_getValue(x += '_development'):
            GM_getValue(x);
    } else {
        return (GENDER.CONFIG.debug) ?
            GM_getValue(x += '_development', y):
            GM_getValue(x, y);
    }
};


GENDER.fetchUserDatabase = function () {
    var key = GENDER.getDatabaseConnectionString();
    var url = 'https://docs.google.com/spreadsheets/d/' + key + '/pub';
    GENDER.log('fetching users database from ' + url);
    GM_xmlhttpRequest({
        'method': 'GET',
        'url': url,
        'onload': function (response) {
            if (!response.finalUrl.match(/^https:\/\/docs.google.com\/spreadsheets\/d/)) {
                GENDER.log('Failed to fetch user database from ' + url);
                return false;
            }
            GENDER.setValue('last_fetch_time', new Date().getTime().toString()); // timestamp this fetch
            GENDER.setValue('user_database', response.responseText);
            GENDER.user_database = GENDER.getValue('user_database');
        }
    });
};
	
GENDER.searchDOM = function() {
	GENDER.log("got into searchDOM");
	GENDER.ellipsis = document.getElementsByClassName("ellipsis");
	var me = GENDER.ellipsis[GENDER.ellipsis.length - 1];
	if ( !me.hasAttribute("data-setGender") ){
		GENDER.log('ellipsis: ' + me.textContent);
		if( me.parentElement.href ) { //GENDER.ellipsis[i].parentElement.href
			var end = me.parentElement.href.search(/\?fref=hovercard/);
			GENDER.log("end: " + end);
			var start = 25;
			var id = me.parentElement.href.slice(start,end);
			GENDER.log("ID: "+id);
			// check the users data store for a match.
			if (-1 !== GENDER.user_ids.indexOf(id)) {
				GENDER.log('found match on this page for user ID ' + id);
				// change the name on the card
				var user_listing;
				var user_string;
				for (var ix = 0; ix < GENDER.tableRows.length; ix++) {
					if (id === GENDER.tableRows[ix].innerHTML) {
						user_listing = GENDER.tableRows[ix].parentNode; // the table row of user listing
					}
				}
				var user_string = user_listing.childNodes[3].innerHTML + " | " + user_listing.childNodes[5].innerHTML;
				me.innerHTML = user_string;
				me.setAttribute("data-setGender", "yes");
			}
		}
		else {
			GENDER.log("no luck");
			me.setAttribute("data-setGender", "no");
		}
	}
	else GENDER.log(me.getAttribute("data-setGender"));
};


// The following is required for Chrome compatibility, as we need "text/html" parsing.
/*
 * DOMParser HTML extension
 * 2012-09-04
 *
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*! @source https://gist.github.com/1129031 */
/*global document, DOMParser*/

(function(DOMParser) {
	"use strict";

	var
	  DOMParser_proto = DOMParser.prototype
	, real_parseFromString = DOMParser_proto.parseFromString
	;

	// Firefox/Opera/IE throw errors on unsupported types
	try {
		// WebKit returns null on unsupported types
		if ((new DOMParser).parseFromString("", "text/html")) {
			// text/html parsing is natively supported
			return;
		}
	} catch (ex) {}

	DOMParser_proto.parseFromString = function(markup, type) {
		if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
			var
			  doc = document.implementation.createHTMLDocument("")
			;

			doc.body.innerHTML = markup;
			return doc;
		} else {
			return real_parseFromString.apply(this, arguments);
		}
	};
}(DOMParser));