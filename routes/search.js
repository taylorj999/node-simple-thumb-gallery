var ObjectId = require('mongodb').ObjectID
   ,config = require('../config/config');

function Search(db, config) {
	"use strict";
	
	// we use startsWith to check if tags have been passed with operators
	// so it would be nice to ensure it's actually there
	if ( typeof String.prototype.startsWith != 'function' ) {
		String.prototype.startsWith = function( str ) {
			return str.length > 0 && this.substring( 0, str.length ) === str;
		};
	}
	
	this.db = db;
	this.options = {"limit":config.site.itemsPerPage};
}

Search.prototype.doSearch = function doSearch(galleryName,searchParams,optionalFields,paginationPage,orderBy) {
	let self = this;
	return new Promise((resolve,reject) => {
		let whereClause = {"gallery":{"$eq":galleryName}};
		let sortClause = {"dateChanged":-1};
		let projectClause = {"title":1,"thumbnail":1,"dateChanged":1};
		if ("description" in searchParams) {
			whereClause["$text"] = {"$search":searchParams["description"]};
			projectClause["score"] = {"$meta":"textScore"};
			sortClause = { "score": { "$meta": "textScore" }, "dateChanged":-1 };
		}
		for (let x=0;x<optionalFields.length;x++) {
			let field = optionalFields[x];
			let fieldname = "optionalFields."+field.name;
			if (field.name in searchParams) {
				if (field.type === "text") {
					whereClause[fieldname] = {"$eq":searchParams[field.name]};
				} else if (field.type === "checkbox" || field.type === "taglist") {
					whereClause[fieldname] = {"$all":searchParams[field.name]};
				}
			}
		}
		// console.log(whereClause);
		let skipValue = (0+paginationPage-1) * self.options["limit"];
		self.db.collection("galleryitem").aggregate([{'$match':whereClause},
													 {'$project':projectClause},
													 {'$sort':sortClause},
													 {'$facet':
							                          {
							                    	    'data': [{'$match':{}},{'$skip':skipValue},{'$limit':self.options["limit"]}],
							                    	    'count': [{'$group':{'_id':null,'count':{'$sum':1}}}]
							                    	  }
							                         }])
							             .toArray()
							             .then((results) => {
							            	 if (results[0].data.length > 0) {
							            		 let searchResults = {"data": results[0].data, "count": results[0].count[0].count};
							            		 resolve(searchResults);
							            	 } else {
							            		 resolve({"data":[],"count":0});
							            	 }
							             })
							             .catch((err) => {
							            	 reject(err);
							             });
	});
};

Search.prototype.view = function view(id) {
	let self = this;
	return new Promise((resolve,reject) => {
		let whereClause = {"_id":{"$eq":new ObjectId(id)}};
		self.db.collection("galleryitem").findOne(whereClause)
		                                 .then((result) => {resolve(result);})
		                                 .catch((err) => {reject(err);});
	});
}

module.exports.Search = Search;