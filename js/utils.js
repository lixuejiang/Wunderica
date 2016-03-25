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

/**
 * @function    addTaskToStorage
 * @description Adds Wunderlist task ID into SyncedTasks storage.
 * @param       wl_task_id  Wunderlist task ID
 */
function addTaskToStorage(wl_task_id) {
	var tasks = JSON.parse(localStorage.getItem('SyncedTasks'));
	tasks.push(wl_task_id);
	localStorage.setItem('SyncedTasks', JSON.stringify(tasks));
}

/**
 * @function    increaseCounter
 * @description Increases counter, stored in localStorage under the key str.
 * @param       str  counter key
 */
function increaseCounter(str) {
	var num = JSON.parse(localStorage.getItem(str));
	localStorage.setItem(str, num + 1);
}