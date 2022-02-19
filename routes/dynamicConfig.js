var ObjectId = require('mongodb').ObjectID;

function DynamicConfig(db) {
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

/*
"config": {
   "galleries": [
      {
         "galleryName": "$GALLERYNAME",
         "galleryVisible": "$BOOLEAN"
      },
      ...
   ],
   "customLists": {
      "$CUSTOMLISTNAME": ["$LISTVAL1","$LISTVAL2"]
   },
   

 */

DynamicConfig.prototype.loadConfig = function loadConfig(config) {
	let self = this;
	return new Promise((resolve, reject) => {
		let whereClause = {};
		if (self.hasValue(config.system.dynamicConfigId)) {
			if (config.system.debug) console.log("Dynamic config id: " + config.system.dynamicConfigId);
			whereClause["_id"] = new ObjectId(config.system.dynamicConfigId);
		}
		self.db.collection("config").find(whereClause).toArray()
		    .then((res) => {
		    	if (config.system.debug) { console.log(res); }
		    	if (self.hasValue(res)) resolve(res[0]);
		    	else resolve(null);
		    })
		    .catch((err) => { reject(new Error("Error retrieving configuration information from db!\n" + err.message)); })
	});
}

DynamicConfig.prototype.loadAndMergeConfig = function loadAndMergeConfig(config) {
	let self = this;
	return new Promise((resolve, reject) => {
		self.loadConfig(config)
		    .then((res) => {
		    	if (res==null) return resolve(null);
		    	if (!self.hasValue(config.system.dynamicConfigId)) config.system.dynamicConfigId = res._id;
		    	if (self.hasValue(res.galleries)) {
		    			for (let x=0; x<res.galleries.length; x++) {
		    				let theGallery = res.galleries[x];
		    				config = self.updateGalleryConfigById(config, theGallery._id, theGallery);
		    			}
		    		}
		    	/*
		    	for (let x=0;x<res.length;x++) {
		    		config.site.dynamicConfigId = res[x]._id;
		    		// Merge main menu items
		    		if (res[x].mainmenu !== undefined) {
		    			let mainmenucount = config.site.mainmenu.length;
		    			for (let y=0;y<res[x].mainmenu.length;y++) {
		    				if (res[x].mainmenu[y].title !== undefined && res[x].mainmenu[y].link !== undefined && res[x].mainmenu[y].caliente !== undefined) {
		    					config.site.mainmenu[mainmenucount] = res[x].mainmenu[y];
		    					mainmenucount++;
		    				}
		    			}
		    		}
		    		//
		    	}
		    	*/
		    	resolve(config);
		    })
		    .catch((err) => { reject(new Error("Error merging config information!\n" + err.message)); })
	});
}

/* 
 * updateConfig = {"configId","galleryId","configData"}
 */
DynamicConfig.prototype.updateConfig = function updateConfig(config, galleryId, updateConfig) {
	let self = this;
	return new Promise((resolve, reject) => {
		let configDBId = null;
		if (config.system.dynamicConfigId !== null) {
			configDBId = new ObjectId(config.system.dynamicConfigId);
		} else {
			configDBId = new ObjectId();
		}
		let whereClause = {"_id":{"$eq":configDBId}};
		let updateClause = [];
		updateClause.push({"$set":{"_id":configDBId}});
		
		let theGalleryConfig = self.findGalleryConfigById(config, galleryId);
		if (theGalleryConfig !== null) {
			theGalleryConfig.galleryName = updateConfig.galleryName;
			theGalleryConfig.galleryVisible = updateConfig.galleryVisible;
			theGalleryConfig.optionalFields = updateConfig.optionalFields;
		} else {
			theGalleryConfig = {};
			theGalleryConfig._id = galleryId;
			theGalleryConfig.galleryName = updateConfig.galleryName;
			theGalleryConfig.galleryVisible = updateConfig.galleryVisible;
			theGalleryConfig.optionalFields = updateConfig.optionalFields;
		}
		
		let ensureGalleriesElementExistsClause = {
		          "$addFields":{
		              "galleries":{
		                 "$ifNull":["$galleries", []]
		              }
		          }
		       };
		
		updateClause.push(ensureGalleriesElementExistsClause);
		
		let upsertArrayElementClause = {
			    "$set": {
			        "galleries": {
			          "$cond": [
			            { "$in": [theGalleryConfig._id, "$galleries._id"] },
			            {
			              "$map": {
			                "input": "$galleries",
			                "in": {
			                  "$mergeObjects": [
			                    "$$this",
			                    {
			                      "$cond": [
			                        { "$eq": ["$$this._id", theGalleryConfig._id] },
			                        theGalleryConfig,
			                        {}
			                      ]
			                    }
			                  ]
			                }
			              }
			            },
			            { "$concatArrays": ["$galleries", [theGalleryConfig]] }
			          ]
			        }
			      }
			    };
		
		updateClause.push(upsertArrayElementClause);
		
		if (config.system.debug) console.log(JSON.stringify(updateClause));
		self.db.collection("config").updateOne(whereClause, updateClause, {'returnOriginal':false,"returnNewDocument":true,"upsert":true})
		  .then((res) => { 
			  if (config.system.debug) console.log(JSON.stringify(res.value));
			  config = self.updateGalleryConfigById(config, galleryId, theGalleryConfig);
			  resolve(config); 
		  })
		  .catch((err) => { reject(new Error("Error updating configuration information!\n" + err.message)); });
	});
}

DynamicConfig.prototype.updateGalleryConfigById = function updateGalleryConfigById(config, galleryId, newGalleryConfig) {
	for (let x=0; x<config.site.galleries.length; x++) {
		if (config.site.galleries[x]._id == galleryId) {
			config.site.galleries[x] = newGalleryConfig;
			return config;
		}
	}
	config.site.galleries.push(newGalleryConfig);
	return config;
}

DynamicConfig.prototype.findGalleryConfigById = function findGalleryConfigById(config, galleryId) {
	for (let x=0; x<config.site.galleries.length; x++) {
		if (config.site.galleries[x]._id == galleryId) {
			return config.site.galleries[x];
		}
	}
	return null;
}

DynamicConfig.prototype.hasValue = function hasValue(varValue) {
	if (varValue === undefined) {
		return false
	} else if (varValue === null) {
		return false;
	} else if (typeof varValue === 'string' && varValue.length==0) {
		return false;
	} else if (typeof varValue === 'Array' && varValue.length==0) {
		return false;
	} else {
		return true;
	}
}


module.exports.DynamicConfig = DynamicConfig;