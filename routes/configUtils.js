const ObjectId = require('mongodb').ObjectID;

function ConfigUtils() {
	"use strict";
	
	// we use startsWith to check if tags have been passed with operators
	// so it would be nice to ensure it's actually there
	if ( typeof String.prototype.startsWith != 'function' ) {
		String.prototype.startsWith = function( str ) {
			return str.length > 0 && this.substring( 0, str.length ) === str;
		};
	}

}

ConfigUtils.prototype.findGalleryById = function findGalleryById(config, id) {
	let galleryConfig = null;
	for (let x=0;x<config.site.galleries.length;x++) {
		if (config.site.galleries[x]["_id"] === id) {
			galleryConfig = config.site.galleries[x];
			break;
		}
	}
	return galleryConfig;
}

module.exports.ConfigUtils = ConfigUtils;