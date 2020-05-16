var ObjectId = require('mongodb').ObjectID
   ,config = require('../config/config');

function Tagutils(db) {
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

Tagutils.prototype.getTagList = function getTagList(galleryName,fieldName) {
	
};

module.exports.Tagutils = Tagutils;