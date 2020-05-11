var config = require('../config/config')
   ,validator = require('validator');

module.exports = exports = function(app, db) {
	"use strict";

	app.get('/',function(req,res) {
		res.render('index', {"page":"Index","galleries":config.site.gallerytabs});
	});
	
	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
	  var err = new Error('Not Found');
	  err.status = 404;
	  next(err);
	});
	
	// error handler
	app.use(function(err, req, res, next) {
	  // render the error page
	  res.status(err.status || 500);
	  res.render('error', {status:err.status, message:err.message});
	});
	
};
