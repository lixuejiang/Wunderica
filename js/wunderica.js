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
var leftToSync = 100; // Just large number.

function sync2() {
	// Updating current step.
	syncStep = 2;

	// Debug.
	console.log("Sync: step #2 started.");

	// Filtering tasks.
	var tasks = arrayDiff(wunderlistTaskIDs, 
		JSON.parse(localStorage.getItem('SyncedTasks')));

	// Saving number of tasks.
	leftToSync = tasks.length;
	console.log(leftToSync + " tasks need to be synced.");

	// Syncing tasks.
	for (i in tasks) {
		pushTask(tasks[i]);
	}

	// Setting checker.
	window.setTimeout(sync2check, 500);
}

function sync2check() {
	// Checking.
	if (leftToSync == 0) {
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

function pushTask(wl_task_id) {
	// Debug.
	console.log("Pushing task WL-#" + wl_task_id);
	// Request to push a task.
	var xmlHttp = new XMLHttpRequest();
	// URL.
    xmlHttp.open("POST", "https://habitica.com:443/api/v2/user/tasks", true);
    // Handler.
    xmlHttp.onreadystatechange = function() {
    	if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
	    	// Getting server answer.
	    	var response = JSON.parse(this.responseText);
	    	// Marking added task as completed.
	    	completeTask(wl_task_id, response.id);
    	}
	};
	// Headers.
	xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.setRequestHeader("x-api-key", wundericaConfig.HabiticaToken);
    xmlHttp.setRequestHeader("x-api-user", wundericaConfig.HabiticaClient);
    // Sending request.
    xmlHttp.send(JSON.stringify({
    	"text": "[Wunderica] " + wunderlistTaskObjects[wl_task_id].title,
    	"type": "todo"
    }));
    // Decrementing the counter.
	leftToSync -= 1;
}

function completeTask(wl_task_id, h_task_id) {
	// Debug.
	console.log("Completing task H-#" + h_task_id);
	// Request to complete task.
	var xmlHttp = new XMLHttpRequest();
	// URL.
    xmlHttp.open("POST", "https://habitica.com:443/api/v2/user/tasks/" + h_task_id + "/up", true);
    // Handler.
    xmlHttp.onreadystatechange = function() {
    	if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
	    	// Task was completed. Saving its Wunderlist id.
	    	addTaskToStorage(wl_task_id);
	   		// Updating statistics.
	   		increaseCounter('#Tasks');
    	}
	};
	// Headers.
	xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.setRequestHeader("x-api-key", wundericaConfig.HabiticaToken);
    xmlHttp.setRequestHeader("x-api-user", wundericaConfig.HabiticaClient);
    // Sending the request.
    xmlHttp.send();
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

//******************************************************************************
// getHabiticaTasks(type)
// Loads Habitica tasks of particular type and returns them.
//******************************************************************************

function getHabiticaTasks(type) {
	// Request to push a task.
	var xmlHttp = new XMLHttpRequest();

	// URL.
	// TODO: Do it asynchronous.
    xmlHttp.open("GET", "https://habitica.com:443/api/v2/user/tasks", false);

	// Headers.
	xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.setRequestHeader("x-api-key", wundericaConfig.HabiticaToken);
    xmlHttp.setRequestHeader("x-api-user", wundericaConfig.HabiticaClient);

    // Sending request.
    xmlHttp.send();

    // Filtering response.
    var response = JSON.parse(xmlHttp.responseText);
    var result = response.filter(function(i) { 
    	return i.type == type
    });

    // Done.
    return result;
}