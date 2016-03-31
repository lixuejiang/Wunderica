/*******************************************************************************
 * This file is a part of Wunderica project.
 *
 * Information about Wunderica license and authors can be found in LICENSE and
 * AUTHORS files respectively or in its git repository:
 * https://github.com/kmingulov/Wunderica
 *******************************************************************************
 * Utils.js contains basic utilities, needed for Wunderica.
 ******************************************************************************/

var Utils = (function() {

	// Variable for public section.
	var pub = {};

	/***************************************************************************
	 * Public methods.
	 **************************************************************************/

	/**
	 * @function    arrayDiff
	 * @description Returns asymmetrical difference of two arrays.
	 * @param       a first array
	 * @param       b second array
	 */
	pub.arrayDiff = function(a, b) {
	    return a.filter(function(i) { return b.indexOf(i) < 0; });
	};

	// Returning the public section.
	return pub;

}());