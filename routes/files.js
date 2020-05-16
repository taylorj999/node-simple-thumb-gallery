var ObjectId = require('mongodb').ObjectID
   ,path = require('path')
   ,fs = require('fs')
   ,os = require('os')
   ,sharp = require('sharp')
   ,axios = require('axios')
   ,config = require('../config/config');

function Files(db) {
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

Files.prototype.add = function add(id,fileTempPath) {
	let self = this;
	return new Promise((resolve,reject) => {
		let newThumbId = new ObjectId();
		let subdirName = newThumbId.toHexString().substring(0,7);
		let dirPath = path.join(__dirname, "../images/" + subdirName);
		fs.mkdirSync(dirPath, { recursive: true });
		let newThumbData = {"_id":newThumbId};
		let image = sharp(fileTempPath);
		image.metadata()
		     .then((metadata) => {
		    	 newThumbData.format = metadata.format;
		    	 newThumbData.width = metadata.width;
		    	 newThumbData.height = metadata.height;
		    	 newThumbData.filename = newThumbId.toHexString() + "." + metadata.format;
		    	 fs.renameSync(fileTempPath,path.join(dirPath, newThumbData.filename));
		    	 return self.db.collection("thumbnails").insertOne(newThumbData);
		     })
		     .then((result) => {
		    	 console.log("Inserted id:" + result.insertedId);
		 		 let whereClause = {"_id":{"$eq":new ObjectId(id)}};
		    	 let updateClause = {"$set":{"thumbnail":newThumbId.toHexString()}};
		    	 return self.db.collection("galleryitem").findOneAndUpdate(whereClause,updateClause,{"returnOriginal":false,"returnNewDocument":true});
		     })
		     .then((result) => { resolve(result.value); })
		     .catch((err) => { reject(err); });
	});
}

Files.prototype.addFromForm = function addFromForm(id,file) {
	let self = this;
	return new Promise((resolve,reject) => {
		self.add(id,file.path)
	    	.then((result) => { resolve(result); })
	    	.catch((err) => { reject(err); });
	});
}

Files.prototype.addFromURL = function addFromURL(id,url) {
	let self = this;
	return new Promise((resolve,reject) => {
		let newThumbId = new ObjectId();
		let tempPath = path.join(os.tmpdir(),newThumbId.toHexString());
		axios({
		    url,
		    responseType: 'stream',
		  })
		  .then((response) => {
		    response.data.pipe(fs.createWriteStream(tempPath))
		            .on('finish', () => { self.add(id,tempPath).then((result) => { resolve(result); }).catch((err) => { reject(err); });})
		            .on('error', (err) => {reject(err);})
		  })
		  .catch((err) => { reject(err); });
	});
}

Files.prototype.getThumbnailName = function getThumbnailName(id) {
	let self = this;
	return new Promise((resolve,reject) => {
		self.db.collection("thumbnails").findOne({"_id":new ObjectId(id)})
		       .then((result) => {
		    	   resolve(result.filename);
		       })
		       .catch((err) => { reject(err); });
	});
}

module.exports.Files = Files;