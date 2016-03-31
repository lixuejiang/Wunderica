/*******************************************************************************
 * This file is a part of Wunderica project.
 *
 * Information about Wunderica license and authors can be found in LICENSE and
 * AUTHORS files respectively or in its git repository:
 * https://github.com/kmingulov/Wunderica
 *******************************************************************************
 * init.js initializes Wunderica; in particular it loads Wunderlist SDK.
 ******************************************************************************/

// Setting up configured flag.
var lastUpdate = localStorage.getItem('LastSync');
var configured = (lastUpdate != undefined);

// Setting up Wunderica configuration.
if (configured) {
	wundericaConfig = {
		'WunderlistClientID': WunderlistClientID,
		'WunderlistToken':    localStorage.getItem('WunderlistToken'),
		'HabiticaClient':     localStorage.getItem('HabiticaClient'),
		'HabiticaToken':      localStorage.getItem('HabiticaToken')
	};
}
else {
	wundericaConfig = {
		'WunderlistClientID': WunderlistClientID
	};
}

// Configuring interface.
if (configured) {
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