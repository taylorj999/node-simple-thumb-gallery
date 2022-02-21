'use strict'
var ObjectId = require('mongodb').ObjectID
   ,path = require('path')
   ,fs = require('fs')
   ,os = require('os')
   ,sharp = require('sharp');

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
}

FilesImpl.prototype.getClient = function getClient() {
	//return this.client;
	return this;
}

FilesImpl.prototype.putImage = function putImage(config,preserveOriginalFile,filePath) {
	let implOptions = config.system.filesImplConfig[config.system.filesImplType];
	let self=this;
	
	return new Promise((resolve, reject) => {
		let image = sharp(filePath);
		let newThumbData = {};
		image.metadata()
	     .then((metadata) => {
	    	 newThumbData.format = metadata.format;
	    	 newThumbData.width = metadata.width;
	    	 newThumbData.height = metadata.height;
	    	 
	    	 let cleanFileId = false;
	 		 let newImageId = new ObjectId();
	 		 let subDirName = newImageId.toHexString().slice(-2);
	 		 let breakCount = 10;
	 		 let newFileName = newImageId.toHexString() + "." + metadata.format;
	 		 while (!cleanFileId) {
	 			breakCount--;
	 			fs.mkdirSync(path.join(implOptions["directoryPath"],subDirName), { recursive: true });
	 			try {
	 				let statsObj = fs.statSync(path.join(implOptions["directoryPath"],subDirName,newFileName));
	 			} catch (err) {
	 				if (err.code === 'ENOENT') {
	 					cleanFileId = true;
	 				} else {
	 					// an actual error
	 					return reject(err);
	 				}
	 			}
	 			if (!cleanFileId) {
	 				newImageId = new ObjectId();
	 				subDirName = newImageId.toHexString().slice(-2);
	 				newFileName = newImageId.toHexString() + "." + metadata.format;
	 			}
	 			if (breakCount == 0) return reject(new Error("Problem allocating new file ID: no unused id could be found"));
	 		 }
	    	 newThumbData.filename = newFileName;
	    	 newThumbData["_id"] = newImageId;
	    	 
	    	 if (preserveOriginalFile) {
	    		 fs.copyFileSync(filePath, path.join(implOptions["directoryPath"],subDirName,newFileName), fs.constants.COPYFILE_EXCL);
	    	 } else {
	    		 fs.renameSync(filePath,path.join(implOptions["directoryPath"],subDirName, newThumbData.filename));
	    	 }
	    	 return self.db.collection("thumbnails").insertOne(newThumbData);
	     })
	     .then((result) => {
	    	 resolve(result.insertedId);
	     })
	     .catch((err) => { 
	    	 console.log("Error writing file to local directory");
	    	 reject(err); 
	     });
	});
}

FilesImpl.prototype.getStream = function getStream(config, imageId) {
	let implOptions = config.system.filesImplConfig[config.system.filesImplType];
	let self=this;
	
	console.log("ImageId: " + imageId);
	
	return new Promise((resolve, reject) => {
		self.db.collection("thumbnails").findOne({"_id":new ObjectId(imageId)})
		       .then((result) => { 
		    	   if (self.hasValue(result)) {
		    		   let fileStream = fs.createReadStream(path.join(implOptions["directoryPath"],result._id.toHexString().slice(-2),self.generateFileName(result._id.toHexString(),result.format)));
		    		   
		    		   fileStream.on('open', function() { resolve(fileStream); });
		    		   fileStream.on('error', function(err) { reject(err); });
		    	   } else {
		    		   reject(new Error("File not found for id: " + imageId));
		    	   }
		       })
		       .catch((err) => { reject(err); });
	});
}

FilesImpl.prototype.generateFileName = function generateFileName(prefix, suffix) {
	if (this.stringContains(prefix,".") || this.stringContains(prefix,"/") || this.stringContains(prefix,"\\")
	    || this.stringContains(suffix,".") || this.stringContains(suffix,"/") || this.stringContains(suffix,"\\")) {
		throw new Error("Potential file access hazard in: " + prefix + " or " + suffix);
	} else {
		return prefix+"."+suffix;
	}
}

FilesImpl.prototype.stringContains = function stringContains(theString,theSubstring) {    
    return theString.indexOf(theSubstring) > -1;
}    

FilesImpl.prototype.hasValue = function hasValue(varValue) {
	if (varValue === undefined) {
		return false
	} else if (varValue === null) {
		return false;
	} else if (typeof varValue === 'string' && varValue.length==0) {
		return false;
	} else {
		return true;
	}
}

module.exports.FilesImpl = FilesImpl;