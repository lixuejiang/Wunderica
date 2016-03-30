/*******************************************************************************
 * This file is a part of Wunderica project.
 *
 * Information about Wunderica license and authors can be found in LICENSE and
 * AUTHORS files respectively or in its git repository:
 * https://github.com/kmingulov/Wunderica
 *******************************************************************************
 * utils.js contains basic utilities, needed for Wunderica.
 ******************************************************************************/

/**
 * @function    arrayDiff
 * @description Returns asymmetrical difference of two arrays.
 * @param       a  first array
 * @param       b  second array
 */
function arrayDiff(a, b) {
    return a.filter(function(i) { return b.indexOf(i) < 0; });
};