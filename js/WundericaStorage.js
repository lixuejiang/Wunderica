/*******************************************************************************
 * This file is a part of Wunderica project.
 *
 * Information about Wunderica license and authors can be found in LICENSE and
 * AUTHORS files respectively or in its git repository:
 * https://github.com/kmingulov/Wunderica
 *******************************************************************************
 * WundericaStorage.js is a small auxiliary object for managing Wunderica
 * statistics.
 ******************************************************************************/

var WundericaStorage = (function() {

	// Variable for public section.
	var pub = {};

	/***************************************************************************
	 * Public methods.
	 **************************************************************************/

	/**
	 * @function addTasks
	 * @description Adds a task to the task storage.
	 * @param task task to be added
	 */
	pub.addTask = function (task) {
		var tasks = JSON.parse(localStorage.getItem('SyncedTasks'));
		tasks.push(task);
		localStorage.setItem('SyncedTasks', JSON.stringify(tasks));
	};

	/**
	 * @function tasks
	 * @description Returns the entire task storage.
	 */
	pub.tasks = function () {
		return JSON.parse(localStorage.getItem('SyncedTasks'));
	};

	/**
	 * @function habitDailyLinks
	 * @description Returns the habit and daily links.
	 */
	pub.habitDailyLinks = function () {
		return JSON.parse(localStorage.getItem('HabitDailyLinks'));
	}

	/**
	 * @function increase
	 * @description Increases a counter.
	 * @param counter counter name
	 */
	pub.increase = function (counter) {
		var num = JSON.parse(localStorage.getItem(counter));
		localStorage.setItem(counter, num + 1);
	};

	/**
	 * @function updateDate
	 * @description Sets the last sync time in the storage to now.
	 */
	pub.updateDate = function () {
		var now = new Date();
		localStorage.setItem('LastSync', now.toLocaleDateString() + " " + 
			now.toLocaleTimeString());
	};

	/**
	 * @function lastDate
	 * @description Returns last sync date.
	 */
	pub.lastDate = function () {
		return localStorage.getItem('LastSync');
	};

	// Returning the public section.
	return pub;

}());