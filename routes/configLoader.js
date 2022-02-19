const ObjectId = require('mongodb').ObjectID;
const DynamicConfig = require('./dynamicConfig').DynamicConfig;

var config = require('../config/config');

function ConfigLoader(db) {
	"use strict";
	
	// we use startsWith to check if tags have been passed with operators
	// so it would be nice to ensure it's actually there
	if ( typeof String.prototype.startsWith != 'function' ) {
		String.prototype.startsWith = function( str ) {
			return str.length > 0 && this.substring( 0, str.length ) === str;
		};
	}
	
	this.db = db;
}

ConfigLoader.prototype.load = function load() {
	let self=this;
	
	return new Promise((resolve,reject) => {
		console.log("Attempting to load configuration file [config.local]...");
		try {
			let localConfig = null;
			try {
				localConfig = require('../config/config.local');
			} catch (e1) {
				console.log("No local configuration file found...");
			}
			if (localConfig !== null) {
				Object.keys(localConfig.system).forEach((keySystem) => {
					config.system[keySystem] = localConfig.system[keySystem];
				});
				Object.keys(localConfig.site).forEach((keySite) => {
					config.site[keySite] = localConfig.site[keySite];
				});
		    	console.log("Local config file loaded...");
			}
	    } catch (e2) {
	    	console.log("Error loading local configuration file:\n" + e2);
	    }
	    console.log("config.site.galleries.length: " + config.site.galleries.length);
	    // do dynamic config stuff here
	    console.log("Loading config from database...");
	    let dynamicConfig = new DynamicConfig(self.db);
	    dynamicConfig.loadAndMergeConfig(config)
	                 .then((result) => {
	                	if (result==null) {
	                		console.log("No database configuration found...");
	                		resolve(config);
	                	}
	                	else resolve(result);
	                 })
	                 .catch((err) => { reject(err); });
	});
}

module.exports.ConfigLoader = ConfigLoader;