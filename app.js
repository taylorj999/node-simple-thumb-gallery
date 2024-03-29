const express = require('express')
  , app = express()
  , MongoClient = require('mongodb').MongoClient
  , routes = require('./routes')
  , path = require('path')
  , bodyParser = require('body-parser')
  , expressSession = require('express-session')
  , formData = require("express-form-data")
  , os = require("os")
  , MongoDBStore = require('connect-mongodb-session')(expressSession)
  , ConfigLoader = require('./routes/configLoader').ConfigLoader
  , ConfigUtils = require('./routes/configUtils').ConfigUtils;
var config = require('./config/config');

/**
 * Options are the same as multiparty takes.
 * But there is a new option "autoClean" to clean all files in "uploadDir" folder after the response.
 * By default, it is "false".
 */
const expressFormDataOptions = {
  uploadDir: os.tmpdir(),
  autoClean: true
};

MongoClient.connect(config.system.mongoConnectString, { useUnifiedTopology: true }, function(err, client) {
    "use strict";
    if(err) throw err;

    var db = client.db();
    
    app.use(express.static(path.join(__dirname, "public")));
    app.use(express.static(path.join(__dirname, "images")));

 // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    
    // Express middleware to populate 'req.body' so we can access POST variables
    // https://www.npmjs.com/package/body-parser
    app.use(bodyParser.urlencoded({'extended':false}));
 
    // parse data with connect-multiparty. 
    app.use(formData.parse(expressFormDataOptions));
    // delete from the request all empty files (size == 0)
    app.use(formData.format());
    // change the file objects to fs.ReadStream 
    app.use(formData.stream());
    // union the body and the files
    app.use(formData.union());
    
    let configLoader = new ConfigLoader(db);
    
    configLoader.load()
       .then((config) => {
	    
    	let configUtils = new ConfigUtils();
    	console.log(configUtils.findGalleryById(config,"0"));

    	// Session middleware is not automatically included with express and has
	    // to be initialized seperately
	    var store = new MongoDBStore({
	    	  uri: config.system.mongoConnectString,
	    	  collection: 'sessions'
	    	});
	    
	    app.use(expressSession({secret: config.system.sessionKey, resave: false, 
			store: store, saveUninitialized: false}));
	        
	    routes(app, db, config);
	    
	    app.set('port', process.env.PORT || config.system.port);
	    app.listen(app.get('port'), function(err) {
	    	if (err) return console.log('something bad happened', err);
	    	console.log('Express server listening on port ' + app.get('port'));
	    });
       })
       .catch((err) => { console.log(err); exit(0); });
});
