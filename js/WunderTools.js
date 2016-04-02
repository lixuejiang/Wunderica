/*******************************************************************************
 * This file is a part of Wunderica project.
 *
 * Information about Wunderica license and authors can be found in LICENSE and
 * AUTHORS files respectively or in its git repository:
 * https://github.com/kmingulov/Wunderica
 *******************************************************************************
 * WunderTools.js is an auxiliary file containing tools for working with 
 * Wunderlist. It is a small wrapper for Wunderlist JS SDK.
 ******************************************************************************/

var WunderTools = (function() {

	// Variable for public section.
	var pub = {};

	/***************************************************************************
	 * Private fields.
	 **************************************************************************/

	/// Wunderlist SDK.
	var SDK = undefined;

	/// Completed tasks, loaded from Wunderlist (IDs).
	var IDs = [];

	/// Completed tasks, loaded from Wunderlist (objects).
	var objects = {};

	/// Subtasks of loaded tasks.
	var subtasks = {};

	/// Number of lists left to fetch.
	var listsLeft;

	/// Number of tasks left to fetch.
	var tasksLeft;

	/***************************************************************************
	 * Public fields.
	 **************************************************************************/

	/// Wunderlist SDK configuration.
	pub.config = {
		'accessToken': undefined,
		'clientID': undefined
	};

	/***************************************************************************
	 * Private methods.
	 **************************************************************************/

	/**
	 * @name fetchTasksCheck
	 * @description Checks whether all tasks were already fetched by fetchTasks
	 *              function.
	 */
	function fetchTasksCheck(handler) {
		// Checking.
		if (listsLeft == 0 && tasksLeft == 0) {
			handler(IDs, objects, subtasks);
		}
		else {
			window.setTimeout(function() { fetchTasksCheck(handler) }, 500);
		}
	}

	/***************************************************************************
	 * Public methods.
	 **************************************************************************/

	/**
	 * @name fetchTasks
	 * @description Fetchs tasks (and their subtasks) from all lists.
	 * @param handler Function handler for the result.
	 */
	pub.fetchTasks = function(handler) {
		// Check, whether Wunderlist SDK is loaded.
		if (SDK == undefined) {
			SDK = new wunderlist.sdk(pub.config);
		}

		// Initilization.
		IDs = [];
		objects = {};
		subtasks = {};
		listsLeft = 100; // Just huge number.
		tasksLeft = 0;

		// Creating handlers for lists and tasks.
		SDK.http.lists.all().done(function(lists) {
			// Saving number of lists.
			listsLeft = lists.length;
			// Iterating over all lists.
			for (i in lists) {
				// Fetching list tasks.
				// "True" for completed tasks.
				SDK.http.tasks.forList(lists[i].id, true)
					.done(function(tasks) {
						// Saving tasks number.
						tasksLeft += tasks.length;
						// Iterating over all tasks.
						for (j in tasks) {
							// Saving ID and object.
							IDs.push(tasks[j].id);
							objects[tasks[j].id] = tasks[j];
							// Fetching all subtasks for this task.
							// Again, only completed are synced.
							SDK.http.subtasks.forTask(tasks[j].id, true)
								.done(function(subtasksData, statusCode) {
									// Saving data.
									for (k in subtasksData) {
										var tid = subtasksData[k].task_id;
										if (subtasks[tid] == undefined) {
											subtasks[tid] = [];
										}
										subtasks[tid].push(subtasksData[k]);
									}
									// One task has just been finished!
									tasksLeft -= 1;
								});
						}
						// One list has just been finished!
						listsLeft -= 1;
					});
			}
		});

		// Enabling check.
		window.setTimeout(function() { fetchTasksCheck(handler) }, 500);
	};

	// Returning the public section.
	return pub;

}());