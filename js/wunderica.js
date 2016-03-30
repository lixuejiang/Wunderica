/*******************************************************************************
 * This file is a part of Wunderica project.
 *
 * Information about Wunderica license and authors can be found in LICENSE and
 * AUTHORS files respectively or in its git repository:
 * https://github.com/kmingulov/Wunderica
 *******************************************************************************
 * wunderica.js is a main Wunderica Javascript file. It contains functions for
 * synchronization between Wunderlist and Habitica.
 ******************************************************************************/

/*******************************************************************************
 * Initialization.
 ******************************************************************************/

HabitTools.config.User = wundericaConfig.HabiticaClient;
HabitTools.config.Key = wundericaConfig.HabiticaToken;

/*******************************************************************************
 * connect()
 *------------------------------------------------------------------------------
 * Stores needed credentials and reloads the page.
 ******************************************************************************/

function connect() {
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
}

/*******************************************************************************
 * disconnect()
 *------------------------------------------------------------------------------
 * Removes everything stored in localStorage.
 ******************************************************************************/

function disconnect() {
	localStorage.clear();
	location.reload();
}

/*******************************************************************************
 * sync()
 *------------------------------------------------------------------------------
 * Syncs Wunderlist to Habitica.
 ******************************************************************************/

//******************************************************************************
// Internal variables
//******************************************************************************

// Completed tasks, loaded from Wunderlist.
// Just IDs.
var wunderlistTaskIDs = [];
// Objects themselves.
var wunderlistTaskObjects = {};

// Current sync step.
var syncStep = 0;

//******************************************************************************
// Sync function
//******************************************************************************

function sync() {
	// Initializing sync variables.
	wunderlistTaskIDs = [];
	wunderlistTaskObjects = {};

	// Initializing SDK.
	wunderlistSDK = new wlSDK({
      'accessToken': wundericaConfig.WunderlistToken,
      'clientID':    wundericaConfig.WunderlistClientID
    });

	// Triggering the first sync step.
	wunderlistSDK.initialized.then(sync1);
}

//******************************************************************************
// sync1
// Loads completed tasks from Wunderlist and stores them in wunderlistTaskIDs
// and wunderlistTaskObjects variables.
//******************************************************************************

// Number of lists, not processed yet by asynchronous fetch function.
var listsLeft = 100; // Just huge number.

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

//******************************************************************************
// sync2
// Pushes completed tasks to Habitica.
//******************************************************************************

// Number of tasks, not yet pushed to Habitica.
var tasksLeftToAdd = 100;
var tasksLeftToComplete = 100;

function sync2() {
	// Updating current step.
	syncStep = 2;

	// Debug.
	console.log("Sync: step #2 started.");

	// Filtering tasks.
	var tasks = arrayDiff(
		wunderlistTaskIDs, 
		JSON.parse(localStorage.getItem('SyncedTasks'))
	);

	console.log(wunderlistTaskIDs);
	console.log(JSON.parse(localStorage.getItem('SyncedTasks')));
	console.log(tasks);

	return;

	// Saving number of tasks.
	tasksLeftToAdd = tasks.length;
	tasksLeftToComplete = 0;
	console.log(tasksLeftToAdd + " tasks need to be synced.");

	// Syncing tasks.
	for (i in tasks) {
		// Wunderlist task ID.
		var wlID = tasks[i];
		// Adding this task to Habitica.
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
						    	addTaskToStorage(wlID);
						   		// Updating statistics.
						   		increaseCounter('#Tasks');
					   		}
						}
					);
				}
			}
		);
	}

	// Setting checker.
	window.setTimeout(sync2check, 500);
}

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

//******************************************************************************
// sync3
// Reloads the page.
//******************************************************************************

function sync3() {
	// Updating sync date.
	var now = new Date();
	localStorage.setItem('LastSync', now.toLocaleDateString() + " " + 
		now.toLocaleTimeString());
	// Reloading after a wait.
	window.setTimeout(sync3reload, 1000);
}

function sync3reload() {
	// TODO!
	//location.reload();
}