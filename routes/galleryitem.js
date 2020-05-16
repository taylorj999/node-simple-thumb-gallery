var ObjectId = require('mongodb').ObjectID
   ,config = require('../config/config');

function Galleryitem(db) {
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

Galleryitem.prototype.addGalleryItem = function addGalleryItem(galleryName,allFields,optionalFields) {
	let self = this;
	return new Promise((resolve,reject) => {
		let newGalleryItem = {};
		newGalleryItem["gallery"] = galleryName;
		newGalleryItem["title"] = allFields["title"];
		newGalleryItem["description"] = allFields["description"];
		newGalleryItem["optionalFields"] = {};
		for (let x=0;x<optionalFields.length;x++) {
			let field = optionalFields[x];
			if (field.name in allFields) {
				newGalleryItem.optionalFields[field.name] = allFields[field.name];
			}
		}
		newGalleryItem["dateChanged"] = new Date();
		self.db.collection("galleryitem").insertOne(newGalleryItem)
		  .then((res) => { resolve(res.insertedId); })
		  .catch((err) => { reject(new Error("Error inserting gallery item!\n" + err.message)); });
	});
};

module.exports.Galleryitem = Galleryitem;