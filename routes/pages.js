/**
 * New node file
 */
var index = require('./index');
var confirm = require('./confirm');

exports.init = function(app) {
	
	// main page
	app.get('/', function (req, res) { res.redirect('/index'); });
	app.get('/index', function (req, res) { res.render('index', {url: 'index'}); });

    // submit request / confirmation page
    app.post('/submitTrackingRequest', index.submitTrackingRequest);
    app.get('/confirm', confirm.show);
    app.get('/error', function (req, res) { res.render('error'); });

	// ajax API
    app.get('/processURL', index.processURL);
};
 
 