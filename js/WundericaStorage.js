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
	 * @function start
	 * @description Starts WundericaStorage.
	 */
	pub.start = function () {
		// Checking, whether there are necessary fields in localStorage.
		if (localStorage.getItem('WunderlistToken') == undefined)
			localStorage.setItem('WunderlistToken', '');
		if (localStorage.getItem('HabiticaClient') == undefined)
			localStorage.setItem('HabiticaClient', '');
		if (localStorage.getItem('HabiticaToken') == undefined)
			localStorage.setItem('HabiticaToken', '');
		if (localStorage.getItem('LastSync') == undefined)
			localStorage.setItem('LastSync', 'never');
		if (localStorage.getItem('SyncedTasks') == undefined)
			localStorage.setItem('SyncedTasks', '[]');
		if (localStorage.getItem('DailyLinks') == undefined)
			localStorage.setItem('DailyLinks', '{}');
		if (localStorage.getItem('#Tasks') == undefined)
			localStorage.setItem('#Tasks', 0);
		if (localStorage.getItem('#Dailies') == undefined)
			localStorage.setItem('#Dailies', 0);
		if (localStorage.getItem('#Habits') == undefined)
			localStorage.setItem('#Habits', 0);
	};

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
	 * @function dailyLinks
	 * @description Returns the daily links.
	 */
	pub.dailyLinks = function () {
		return JSON.parse(localStorage.getItem('DailyLinks'));
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