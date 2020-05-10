var express = require('express')
  , app = express()
  , MongoClient = require('mongodb').MongoClient
  , routes = require('./routes')
  , path = require('path')
  , config = require('./config/config')
  , bodyParser = require('body-parser')
  , expressSession = require('express-session')
  , MongoDBStore = require('connect-mongodb-session')(expressSession);

MongoClient.connect(config.system.mongoConnectString, { useUnifiedTopology: true }, function(err, client) {
    "use strict";
    if(err) throw err;

    var db = client.db();
    
    app.use(express.static(path.join(__dirname, "public")));
//    app.use(express.static(path.join(__dirname, "images")));

 // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    
    // Express middleware to populate 'req.body' so we can access POST variables
    // https://www.npmjs.com/package/body-parser
    app.use(bodyParser.urlencoded({'extended':false}));
 
    // Session middleware is not automatically included with express and has
    // to be initialized seperately
    var store = new MongoDBStore({
    	  uri: config.system.mongoConnectString,
    	  collection: 'sessions'
    	});
    
    app.use(expressSession({secret: config.system.sessionKey, resave: false, 
		store: store, saveUninitialized: false}));
    
    routes(app, db);
    
    app.set('port', process.env.PORT || config.system.port);
    app.listen(app.get('port'), function(err) {
    	if (err) return console.log('something bad happened', err);
    	console.log('Express server listening on port ' + app.get('port'));
    });

});
