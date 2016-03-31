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

	/// Last update date.
	pub.lastUpdate = undefined;

	/// Flag indicating whether Wunderica is configured (i.e. is connected to
	/// Habitica and Wunderlist).
	pub.configured = undefined;

	/***************************************************************************
	 * Private fields.
	 **************************************************************************/

	/// Configuration.
	var config = {};

	/// Wunderlist SDK.
	var wunderlistSDK;

	/// Completed tasks, loaded from Wunderlist (IDs).
	var wunderlistTaskIDs = [];
	/// Completed tasks, loaded from Wunderlist (objects).
	var wunderlistTaskObjects = {};

	/// Current sync step.
	var syncStep = 0;

	//
	// TODO
	//
	/// Number of lists, not processed yet by asynchronous fetch function.
	var listsLeft = 100;
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
		// Setting up configured flag.
		pub.lastUpdate = WundericaStorage.lastDate();
		pub.configured = (pub.lastUpdate != undefined);

		// Setting up Wunderica configuration.
		if (pub.configured) {
			// Setting up config.
			config = {
				'WunderlistClientID': WundericaConfig.WunderlistClientID,
				'WunderlistToken':    localStorage.getItem('WunderlistToken'),
				'HabiticaClient':     localStorage.getItem('HabiticaClient'),
				'HabiticaToken':      localStorage.getItem('HabiticaToken')
			};

			// Establishing connecto to Wunderlist.
			wunderlistSDK = new wunderlist.sdk({
		      'accessToken': config.WunderlistToken,
		      'clientID':    config.WunderlistClientID
		    });
			// Configuring HabitTools.
			HabitTools.config.User = config.HabiticaClient;
			HabitTools.config.Key = config.HabiticaToken;
		}
		else {
			config = {
				'WunderlistClientID': WundericaConfig.WunderlistClientID
			};
		}

		//
		// TODO: Move to WundericaGUI!
		//

		// Configuring interface.
		if (pub.configured) {
			$('#accounts-connected').show();
			$('#stat-last-sync').html(localStorage.getItem('LastSync'));
			$('#stat-tasks-synced').html(localStorage.getItem('#Tasks'));
			$('#stat-dailies-synced').html(localStorage.getItem('#Dailies'));
			$('#stat-habits-triggered').html(localStorage.getItem('#Habits'));
			$('#stats').show();
		}
		else {
			$('#accounts-not-connected').show();
		}
	};

	/**
	 * @name connect
	 * @description 
	 */
	pub.connect = function () {
		//
		// TODO: 
		//

		// Credentials.
		localStorage.setItem('WunderlistToken', $('#inputWunderToken').val());
		localStorage.setItem('HabiticaClient',  $('#inputHabitClient').val());
		localStorage.setItem('HabiticaToken',   $('#inputHabitToken').val());
		// Stats.
		localStorage.setItem('LastSync',    'never');
		localStorage.setItem('SyncedTasks', '[]');
		localStorage.setItem('#Tasks',      0);
		localStorage.setItem('#Dailies',    0);
		localStorage.setItem('#Habits',     0);
		// Reloading the page.
		location.reload();
	};

	/**
	 * @name disconnect
	 * @description Disconnects from Habitica and Wunderlist.
	 */
	pub.disconnect = function () {
		localStorage.clear();
		location.reload();
	};

	/**
	 * @name sync
	 * @description Syncs Wunderlist tasks to Habitica.
	 */ 
	pub.sync = function () {
		// Initializing sync variables.
		wunderlistTaskIDs = [];
		wunderlistTaskObjects = {};
		syncStep = 0;

		// Starting the first sync step.
		sync1();
	}

	/***************************************************************************
	 * Private methods.
	 **************************************************************************/

	/**
	 * @name sync1
	 * @description The first sync step.
	 */
	function sync1() {
		// Updating current step.
		syncStep = 1;

		// Debug.
		console.log("Sync: step #1 started.");

		// Initialization.
		wunderlistTaskIDs = [];
		wunderlistTaskObjects = {};
		listLeft = 100; // Just huge number.

		// Creating handlers for lists and tasks.
		wunderlistSDK.http.lists.all().done(function (lists) {
			// Saving number of lists.
			listsLeft = lists.length;
			// Iterating over all lists.
			for (i in lists) {
				// true for completed tasks.
				var listTasks = wunderlistSDK.http.tasks.forList(lists[i].id, true)
					.done(function (tasks) {
						// Iterating over all tasks.
						for (j in tasks) {
							// Saving ID and object.
							wunderlistTaskIDs.push(tasks[j].id);
							wunderlistTaskObjects[tasks[j].id] = tasks[j];
						}
						// One list finished!
						listsLeft -= 1;
					});
			}
		});

		// Setting up checker.
		window.setTimeout(sync1check, 500);
	}

	/**
	 * @name sync1check
	 * @description Checks, whether the first step is completed.
	 */
	function sync1check() {
		// Checking.
		if (listsLeft == 0) {
			// Debug.
			console.log("Fetched " + wunderlistTaskIDs.length + " completed tasks.");
			console.log("Sync: step #1 finished.");
			// Triggering next step.
			sync2();
		}
		else {
			// Check again in 500 ms.
			window.setTimeout(sync1check, 500);
		}
	}

	/**
	 * @name sync2
	 * @description The second sync step.
	 */
	function sync2() {
		// Updating current step.
		syncStep = 2;

		// Debug.
		console.log("Sync: step #2 started.");

		// Filtering tasks.
		var tasks = Utils.arrayDiff(
			wunderlistTaskIDs,
			WundericaStorage.tasks()
		);

		// Saving number of tasks.
		tasksLeftToAdd = tasks.length;
		tasksLeftToComplete = 0;
		console.log(tasksLeftToAdd + " tasks need to be synced.");

		// Syncing tasks.
		for (i in tasks) {
			// Adding this task to Habitica.
			(function (wlID) {
				HabitTools.addTask(
					// Task title.
					"[Wunderica] " + wunderlistTaskObjects[wlID].title,
					// Task type.
					"todo",
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
			})(tasks[i]);
		}

		// Setting checker.
		window.setTimeout(sync2check, 500);
	}

	/**
	 * @name sync2check
	 * @description Checks, whether the second step is completed.
	 */
	function sync2check() {
		// Checking whether all tasks were added and completed.
		if (tasksLeftToAdd == 0 && tasksLeftToComplete == 0) {
			// Debug.
			console.log("Sync: step #2 finished.");
			// Triggering next step.
			sync3();
		}
		else {
			// Check again in 500 ms.
			window.setTimeout(sync2check, 500);
		}
	}

	/**
	 * @name sync3
	 * @description The third sync step.
	 */
	function sync3() {
		// Updating sync date.
		var now = new Date();
		localStorage.setItem('LastSync', now.toLocaleDateString() + " " + 
			now.toLocaleTimeString());

		//
		// TODO
		//
		// Reloading.
		//location.reload();
	}

	// Returning the public section.
	return pub;

}());