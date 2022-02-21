var ObjectId = require('mongodb').ObjectID;

function FilesImpl(config, db) {
	"use strict";
	
	// we use startsWith to check if tags have been passed with operators
	// so it would be nice to ensure it's actually there
	if ( typeof String.prototype.startsWith != 'function' ) {
		String.prototype.startsWith = function( str ) {
			return str.length > 0 && this.substring( 0, str.length ) === str;
		};
	}
	
	this.db = db;
	
	let implModule = './filesImpl-' + config.system.filesImplType + ".js";
	
	if (config.system.debug) console.log("Loading module: " + implModule);
	
	let implModuleLoaded = require(implModule);
	
	this.impl = new implModuleLoaded.FilesImpl(config, db);
}

FilesImpl.prototype.getClient = function getClient() {
	return this.impl.getClient();
}

module.exports.FilesImpl = FilesImpl;