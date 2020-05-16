var ObjectId = require('mongodb').ObjectID
   ,config = require('../config/config');

function Edit(db) {
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

Edit.prototype.update = function update(id,updateParams,optionalFields) {
	let self = this;
	return new Promise((resolve,reject) => {
		let whereClause = {"_id":{"$eq":new ObjectId(id)}};
		let updateClause = {"$set":{},"$unset":{}};
		updateClause["$set"]["title"] = updateParams["title"];
		updateClause["$set"]["description"] = updateParams["description"];
		updateClause["$unset"] = {};
		for (let x=0;x<optionalFields.length;x++) {
			let field = optionalFields[x];
			if (field.name in updateParams) {
				updateClause["$set"]["optionalFields." +field.name] = updateParams[field.name];
			} else {
				updateClause["$unset"]["optionalFields." + field.name] = "";
			}
		}
		updateClause["$currentDate"] = {"dateChanged":true};
		console.log(JSON.stringify(updateClause));
		self.db.collection("galleryitem").findOneAndUpdate(whereClause,updateClause,{'returnOriginal':false,"returnNewDocument":true})
		  .then((res) => { console.log(JSON.stringify(res.value)); resolve(res.value); })
		  .catch((err) => { reject(new Error("Error inserting gallery item!\n" + err.message)); });
	});
};

module.exports.Edit = Edit;