/*******************************************************************************
 * This file is a part of Wunderica project.
 *
 * Information about Wunderica license and authors can be found in LICENSE and
 * AUTHORS files respectively or in its git repository:
 * https://github.com/kmingulov/Wunderica
 *******************************************************************************
 * HabitTools.js is an auxiliary file containing tools for working with 
 * Habitica. Particulary, here is Habitica request stack located.
 ******************************************************************************/

var HabitTools = (function() {

	// Variable for public section.
	var pub = {};

	/***************************************************************************
	 * Private fields.
	 **************************************************************************/

	// Queue with all Habitica requests.
	var RequestQueue = [];

	/***************************************************************************
	 * Public fields.
	 **************************************************************************/

	// Habitica credentials.
	pub.config = {
		'User': '',
		'Key': ''
	};

	/***************************************************************************
	 * Private methods.
	 **************************************************************************/

	/**
	 * @function NewRequest
	 * @description Creates a new request object for sending data to Habitica.
	 * @param method  Request method.
	 * @param url     URL for request.
	 * @param data    Request data.
	 * @param handler User handler for the request result.
	 */
	function NewRequest(method, url, data, handler) {
		// Creating a HTTP request.
		var xmlHttp = new XMLHttpRequest();
	    xmlHttp.open(method, url, true);
		xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	    xmlHttp.setRequestHeader("x-api-key", pub.config.Key);
	    xmlHttp.setRequestHeader("x-api-user", pub.config.User);
	    // Setting up the request data.
	    xmlHttp.RequestData = data;
	    // Adding the handler.
	    xmlHttp.onreadystatechange = function() {
	    	if (xmlHttp.readyState == 4) {
	    		// Calling user handler.
	    		handler(xmlHttp.status, JSON.parse(this.responseText));
				// This request finished, fetch a new one.
				FetchRequest();
	    	}
		};
		// Done.
		return xmlHttp;
	};

	/**
	 * @function FetchRequest
	 * @description Fetches a request from the queue and (if any) sends it.
	 */
	function FetchRequest() {
		// No request in queue.
		if (RequestQueue.length == 0) {
			// Try to fetch them later.
			window.setTimeout(FetchRequest, 100);
		}
		else {
			// Getting the request.
			var request = RequestQueue.shift();
			// Sending the request.
			if (request.RequestData != "") {
				request.send(JSON.stringify(request.RequestData));
			}
			else {
				request.send();
			}
		}
	};

	// FetchRequest will be called automatically.
	window.setTimeout(FetchRequest, 100);

	/***************************************************************************
	 * Public methods.
	 **************************************************************************/

	/**
	 * @function addTask
	 * @description Adds a task to Habitica.
	 * @param text    Task title.
	 * @param type    Task type (todo/daily/habit).
	 * @param handler Function, which will be called after. This function must
	 *                have two arguments: the first one is XMLHttpRequest 
	 *                status, the second one is a Habitica response.
	 */
	pub.addTask = function(text, type, handler) {
		// Creating a HTTP request.
		var xmlHttp = NewRequest(
			"POST",
			"https://habitica.com:443/api/v2/user/tasks",
			{"text": text, "type": type},
			handler
		);
		// Adding the request to the queue.
		RequestQueue.push(xmlHttp);
	};

	/**
	 * @function completeTask
	 * @description Completes a task on Habitica.
	 * @param id      Task ID.
	 * @param handler User handler.
	 */
	pub.completeTask = function(id, handler) {
		// Creating a HTTP request.
		var xmlHttp = NewRequest(
			"POST",
			"https://habitica.com:443/api/v2/user/tasks/" + id + "/up",
			"",
			handler
		);
		// Adding the request to the queue.
		RequestQueue.push(xmlHttp);
	};

	/**
	 * @function getTasks
	 * @description Returns all tasks of the particular type.
	 * @param handler User handler.
	 */
	pub.getTasks = function(handler) {
		// Creating a HTTP request.
		var xmlHttp = NewRequest(
			"GET",
			"https://habitica.com:443/api/v2/user/tasks",
			"",
			handler
		);
		// Adding the request to the queue.
		RequestQueue.push(xmlHttp);
	};

	// Returning the public section.
	return pub;

}());