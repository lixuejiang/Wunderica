/*******************************************************************************
 * This file is a part of Wunderica project.
 *
 * Information about Wunderica license and authors can be found in LICENSE and
 * AUTHORS files respectively or in its git repository:
 * https://github.com/kmingulov/Wunderica
 *******************************************************************************
 * WundericaUI.js contains functions for managing Wunderica GUI.
 ******************************************************************************/

var WundericaUI = (function() {

	// Variable for public section.
	var pub = {};

	/***************************************************************************
	 * Public methods.
	 **************************************************************************/

	/**
	 * @function start
	 * @description Initializes Wunderica UI.
	 */
	pub.start = function () {
		// Is Wunderica configured?
		if (Wunderica.connectedToHabitica && Wunderica.connectedToWunderlist) {
			$('#accounts-connected').show();
			$('#stat-last-sync').html(localStorage.getItem('LastSync'));
			$('#stat-tasks-synced').html(localStorage.getItem('#Tasks'));
			$('#stat-dailies-synced').html(localStorage.getItem('#Dailies'));
			$('#stat-habits-triggered').html(localStorage.getItem('#Habits'));
			$('#stats').show();
		}
		else {
			// Checking whether we got state and code from the Wunderlist.
			var state = Utils.getURLParameter('state');
			var code = Utils.getURLParameter('code');
			// Flag indicating whether connection buttons must be shown.
			var showButtons = false;

			// We received nothing.
			if (state == null || code == null) {
				// We need to show buttons.
				showButtons = true;
				// Checking whether there was an error.
				if (state != null || code != null) {
					alert('Something went wrong with your connection to Wunderlist.\nPlease, try again.');
				}
			}
			// Well, we received something.
			else {
				// Checking whether state is right.
				if (state != localStorage.getItem('RandomString')) {
					// Showing warning.
					alert('Something went wrong with your connection to Wunderlist.\nPlease, try again.');
					// We need to display buttons.
					showButtons = true;
				}
				else {
					// Fine. Saving the code.
					Wunderica.connectToWunderlist(code);
					// Reloading.
					window.location.replace(WundericaConfig.WundericaURL);
				}
			}

			// Have we decided to show buttons?
			if (showButtons) {
				// Showing necessary buttons.
				$('#accounts-not-connected').show();
				if (Wunderica.connectedToHabitica) {
					$("#habitica-not-connected").hide();
				}
				if (Wunderica.connectedToWunderlist) {
					$("#wlist-not-connected").hide();
				}
				else {
					// Generating random string.
					localStorage.setItem('RandomString', Math.random().toString(36).substring(2));
					// Initializing Wunderlist button.
					$("#wlist-connect-btn").attr(
						"href",
						"https://www.wunderlist.com/oauth/authorize?client_id=" +
							WundericaConfig.WunderlistClientID +
							"&redirect_uri=" + WundericaConfig.WundericaURL +
							"&state=" + localStorage.getItem('RandomString')
					);
				}
			}
		}
	};

	/**
	 * @function connectToHabitica
	 * @description Connects Wunderica to Wunderlist.
	 */
	pub.connectToHabitica = function () {
		// Connecting.
		Wunderica.connectToHabitica(
			$('#inputHabitClient').val(),
			$('#inputHabitToken').val()
		);
		// Reloading the page.
		location.reload();
	};

	/**
	 * @function disconnect
	 * @description Disconnects Wunderica from Wunderlist and Habitica.
	 */
	pub.disconnect = function () {
		Wunderica.disconnect();
		location.reload();
	};

	/**
	 * @function sync
	 * @description Syncs Wunderlist to Habitica, using Wunderica.sync() function.
	 */
	pub.sync = function () {
		// Handler for sync messages.
		var messageHandler = (function (msg) {
			// Getting current contents of #syncModalMessages.
			var html = $("#syncModalMessages").html();
			// Adding this message.
			if (msg.msg == "sync-start")
				html += "<p>Sync has started.</p>";
			else if (msg.msg == "wlist-fetch-start")
				html += "<p>Started to fetching completed tasks from Wunderlist.</p>";
			else if (msg.msg == "wlist-fetch-finish")
				html += "<p>Fetches " + msg.num + " tasks from Wunderlist.</p>";
			else if (msg.msg == "habit-push-start")
				html += "<p>" + msg.num + " tasks need to be pushed to Habitica.</p>";
			else if (msg.msg == "habit-pushed-task")
				html += "<p>Pushed one task to Habitica.</p>";
			else if (msg.msg == "habit-push-finish")
				html += "<p>Finished to push tasks to Habitica.</p>";
			else if (msg.msg == "sync-finish") {
				html += "<p>Sync has finished.</p>";
				html += "<p>Now you can close this Window.</p>";
				$("#syncModalCloseBtn").attr('class', 'btn btn-default');
			}
			// Setting up new contents.
			$("#syncModalMessages").html(html);
		});

		// Showing sync window.
		$("#syncModal").modal("show");

		// Finally, calling sync.
		Wunderica.sync(messageHandler);
	};

	// Returning the public section.
	return pub;

}());