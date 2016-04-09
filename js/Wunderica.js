/*******************************************************************************
 * This file is a part of Wunderica project.
 *
 * Information about Wunderica license and authors can be found in LICENSE and
 * AUTHORS files respectively or in its git repository:
 * https://github.com/kmingulov/Wunderica
 *******************************************************************************
 * Wunderica.js is a main Wunderica Javascript file. It contains functions for
 * synchronization between Wunderlist and Habitica.
 ******************************************************************************/

var Wunderica = (function () {

	// Variable for public section.
	var pub = {};

	/***************************************************************************
	 * Public fields.
	 **************************************************************************/

	/// Flag indicating whether Wunderica is connected to Wunderlist.
	pub.connectedToWunderlist = undefined;
	/// Flag indicating whether Wunderica is connected to Habitica.
	pub.connectedToHabitica = undefined;

	/***************************************************************************
	 * Private fields.
	 **************************************************************************/

	/// Configuration.
	var config = {};

	/// Tasks fetched from Wunderlist (IDs).
	var wunderlistIDs;
	/// Tasks fetched from Wunderlist (objects).
	var wunderlistObjects;
	/// Subtasks fetched from Wunderlist.
	var wunderlistSubtasks;
	
	/// Number of tasks, not yet pushed to Habitica.
	var tasksLeftToAdd = 100;
	var tasksLeftToComplete = 100;

	/***************************************************************************
	 * Public methods.
	 **************************************************************************/

	/**
	 * @name start
	 * @description Starts Wunderica.
	 */
	pub.start = function() {
		// Setting up config.
		config = {
			'WunderlistClientID': WundericaConfig.WunderlistClientID,
			'WunderlistToken':    localStorage.getItem('WunderlistToken'),
			'HabiticaClient':     localStorage.getItem('HabiticaClient'),
			'HabiticaToken':      localStorage.getItem('HabiticaToken')
		};

		// Setting up "connected" flags.
		pub.connectedToWunderlist = config.WunderlistToken != '';
		pub.connectedToHabitica = 
			config.HabiticaClient != '' && config.HabiticaToken != '';

	    // Configuring WunderTools.
	    WunderTools.config = {
	      'accessToken': config.WunderlistToken,
	      'clientID':    config.WunderlistClientID
	    };

		// Configuring HabitTools.
		HabitTools.config.User = config.HabiticaClient;
		HabitTools.config.Key = config.HabiticaToken;
	};

	/**
	 * @name connect
	 * @description Connects Wunderica to Wunderlist.
	 * @param wunderToken Wunderlist Auth Token
	 */
	pub.connectToWunderlist = function (wunderToken) {
		// Saving credentials.
		localStorage.setItem('WunderlistToken', wunderToken);
	};

	/**
	 * @name connectToHabitica
	 * @description Connects Wunderica to Habitica.
	 * @param habitClient Habitica Client ID
	 * @param habitToken  Habitica Auth Token
	 */
	pub.connectToHabitica = function (habitClient, habitToken) {
		// Credentials.
		localStorage.setItem('HabiticaClient',  habitClient);
		localStorage.setItem('HabiticaToken',   habitToken);
	};

	/**
	 * @name disconnect
	 * @description Disconnects from Habitica and Wunderlist.
	 */
	pub.disconnect = function () {
		localStorage.clear();
	};

	/**
	 * @name sync
	 * @description Syncs Wunderlist tasks to Habitica.
	 * @param messageHandler Function to handle sync messages. Possible 
	 *                       messages:
	 *   {"msg": "sync-start"}
	 *     Sync has started.
	 *   {"msg": "wlist-fetch-start"}
	 *     Started to fetch tasks from Wunderlist.
	 *   {"msg": "wlist-fetch-finish", "num": N}
	 *     N completed tasks were fetched from Wunderlist.
	 *   {"msg": "habit-push-start", "num": N}
	 *     N tasks must be pushed to Habitica.
	 *   {"msg": "habit-pushed-task"}
	 *     1 task was pushed to Habitica.
	 *   {"msg": "habit-push-finish"}
	 *     Finished to push tasks to Habitica.
	 *   {"msg": "sync-finish"}
	 *     Sync has finished.
	 */ 
	pub.sync = function (messageHandler) {
		// Sending the messages.
		messageHandler({"msg": "sync-start"});
		messageHandler({"msg": "wlist-fetch-start"});

		// Fetching tasks from Wunderlist by WunderTools.
		WunderTools.fetchTasks(function(IDs, objects, subtasks) {
			// Sending the message.
			messageHandler({"msg": "wlist-fetch-finish", "num": IDs.length});
			// Saving everything.
			wunderlistIDs = IDs;
			wunderlistObjects = objects;
			wunderlistSubtasks = subtasks;
			// Triggering the next step.
			sync2(messageHandler);
		});
	}

	/***************************************************************************
	 * Private methods.
	 **************************************************************************/

	/**
	 * @name sync2
	 * @description The second sync step.
	 * @param messageHandler Function to handle sync messages.
	 */
	function sync2(messageHandler) {
		// Filtering tasks.
		var tasks = Utils.arrayDiff(
			wunderlistIDs,
			WundericaStorage.tasks()
		);

		// Saving number of tasks.
		tasksLeftToAdd = tasks.length;
		tasksLeftToComplete = 0;

		// Sending the message.
		messageHandler({"msg": "habit-push-start", "num": tasksLeftToAdd});

		// Loading daily links.
		var dailyLinks = WundericaStorage.dailyLinks();

		// Syncing tasks.
		for (i in tasks) {
			(function (wlID) {
				// Checking whether this task is a daily link.
				if (dailyLinks[wunderlistObjects[wlID].title] != undefined) {
					// This is a daily, completing it.
					HabitTools.completeTask(
						// Task ID.
						dailyLinks[wunderlistObjects[wlID].title],
						// Handler.
						function (status, response) {
							if (status == 200) {
								// Sending the message.
								messageHandler({"msg": "habit-pushed-task"});
								// Task was completed. Decreasing the counter.
								tasksLeftToAdd -= 1;
						    	// Saving its Wunderlist ID.
						    	WundericaStorage.addTask(wlID);
						   		// Increasing the counter.
						   		WundericaStorage.increase('#Dailies');
					   		}
						}
					);
				}
				// Adding this task.
				else {
					// Preparing subtasks (if any).
					var subs = [];
					if (wunderlistSubtasks[wlID] != undefined) {
						subs = wunderlistSubtasks[wlID]
							// Sorting subtasks by ID.
							.sort(function(a, b) { return a.id - b.id; })
							// Getting only titles.
							.map(function(val) { return val.title; });
					}
					// Adding the task.
					HabitTools.addTask(
						// Task title.
						"[Wunderica] " + wunderlistObjects[wlID].title,
						// Task type.
						"todo",
						// Subtasks.
						subs,
						// Handler.
						function(status, response) {
							// We tried to add a task.
							tasksLeftToAdd -= 1;
							// Was our trial successful?
							if (status == 200) {
								// Now we need to mark this task as complete.
								tasksLeftToComplete += 1;
								// Getting the Habitica ID.
								var hID = response.id;
								// Adding a new request, now to complete added task.
								HabitTools.completeTask(
									// Task ID.
									hID,
									// Handler.
									function (status, response) {
										if (status == 200) {
											// Sending the message.
											messageHandler({"msg": 
												"habit-pushed-task"});
											// Task was completed.
											tasksLeftToComplete -= 1;
									    	// Saving its Wunderlist ID.
									    	WundericaStorage.addTask(wlID);
									   		// Increasing the counter.
									   		WundericaStorage.increase('#Tasks');
								   		}
									}
								);
							}
						}
					);
				}
			})(tasks[i]);
		}

		// Setting checker.
		window.setTimeout(function () { sync2check(messageHandler); }, 500);
	}

	/**
	 * @name sync2check
	 * @description Checks, whether the second step is completed.
	 * @param messageHandler Function to handle sync messages.
	 */
	function sync2check(messageHandler) {
		// Checking whether all tasks were added and completed.
		if (tasksLeftToAdd == 0 && tasksLeftToComplete == 0) {
			// Sending the message.
			messageHandler({"msg": "habit-push-finish"});
			// Triggering next step.
			sync3(messageHandler);
		}
		else {
			// Check again in 500 ms.
			window.setTimeout(function () { sync2check(messageHandler); }, 500);
		}
	}

	/**
	 * @name sync3
	 * @description The third sync step.
	 * @param messageHandler Function to handle sync messages.
	 */
	function sync3(messageHandler) {
		// Updating sync date.
		var now = new Date();
		localStorage.setItem('LastSync', now.toLocaleDateString() + " " + 
			now.toLocaleTimeString());

		// Sending the message.
		messageHandler({"msg": "sync-finish"});
	}

	// Returning the public section.
	return pub;

}());