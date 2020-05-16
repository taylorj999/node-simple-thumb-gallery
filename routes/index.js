var config = require('../config/config')
   ,validator = require('validator')
   ,path = require('path')
   ,Galleryitem = require('./galleryitem').Galleryitem
   ,Search = require("./search").Search
   ,Edit = require("./edit").Edit
   ,Files = require("./files").Files
   ,ObjectId = require('mongodb').ObjectID;

module.exports = exports = function(app, db) {
	"use strict";

	
	app.get('/',function(req,res) {
		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{}};
		let gallery = getVariableParameter(req,"gallery");
		if (gallery != undefined && gallery != null) {
			if (!hasValue(gallery)) {
				clearSessionVariable(req,"gallery");
				gallery = null;
			} else {
				setSessionVariable(req,"gallery",gallery);
			}
		} else {
			gallery = getVariable(req,"gallery");
		}
		if (gallery === undefined || gallery === null) {
			gallery = "Select";
		}
		pageParams["page"] = "index"; pageParams["gallery"] = gallery;
		return res.render('index', pageParams);
	});
	
	app.get('/add',function(req,res) {
		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{}};
		let gallery = getVariable(req,"gallery");
		if (!hasValue(gallery)) {
			pageParams["page"] = "index"; pageParams["gallery"] = "Select"; pageParams["errorMsg"] = "No gallery selected!";
			return res.render('index',pageParams);
		} else {
			let galleryIndex = config.site.gallerytabs.indexOf(gallery);
			if (galleryIndex === -1) {
				pageParams["page"] = "index"; pageParams["gallery"] = "Select"; pageParams["errorMsg"] = "Invalid gallery!";
				return res.render('index',pageParams);
			}
			pageParams["page"] = "add"; pageParams["gallery"] = gallery; pageParams["optionalFields"] = config.site.optionalFields[galleryIndex];
			return res.render('add',pageParams);
		}
	});
	
	app.post('/add',function(req,res) {
		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{}};
		let gallery = getVariable(req,"gallery");
		if (!hasValue(gallery)) {
			pageParams["page"] = "index"; pageParams["gallery"] = "Select"; pageParams["errorMsg"] = "No gallery selected!";
			return res.render('index',pageParams);
		} else {
			pageParams["gallery"] = gallery;
			let galleryIndex = config.site.gallerytabs.indexOf(gallery);
			if (galleryIndex === -1) {
				pageParams["page"] = "index"; pageParams["gallery"] = "Select"; pageParams["errorMsg"] = "Invalid gallery!";
				return res.render('index',pageParams);
			}
			let addParams = getSearchParameters(req,config.site.optionalFields[galleryIndex]);
			let galleryItem = new Galleryitem(db);
			pageParams["optionalFields"] = config.site.optionalFields[galleryIndex];
			galleryItem.addGalleryItem(gallery,addParams,config.site.optionalFields[galleryIndex])
			           .then(result => { 
			        	   let searchObj = new Search(db,config);
			        	   return searchObj.view(result)
			           })
			           .then((result) => {
			   			   console.log(JSON.stringify(result));
			   			   pageParams["result"] = result; pageParams["page"] = "edit";
			   			   return res.render('edit',pageParams);
			           })
			           .catch(err => { pageParams["errorMsg"] = err.message; return res.render('index',pageParams)});
		}		
	});
	
	app.use('/search',function(req,res) {
		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{}};
		let gallery = getVariable(req,"gallery");
		if (!hasValue(gallery)) {
			pageParams["page"] = "index"; pageParams["gallery"] = "Select"; pageParams["errorMsg"] = "No gallery selected!";
			return res.render('index',pageParams);
		} else {
			let galleryIndex = config.site.gallerytabs.indexOf(gallery);
			if (galleryIndex === -1) {
				pageParams["page"] = "index"; pageParams["gallery"] = "Select"; pageParams["errorMsg"] = "Invalid gallery!";
				return res.render('index',pageParams);
			}
			let searchParams = null;
			if (getVariableParameter(req,"search") && getVariableParameter(req,"search") === "new") {
				clearSessionVariable(req,"searchParams");
				searchParams = getSearchParameters(req,config.site.optionalFields[galleryIndex]);
				setSessionVariable(req,"searchParams",searchParams);
			} else {
				searchParams = getSessionVariable(req,"searchParams");
			}
			console.log(JSON.stringify(searchParams));
			let searchObj = new Search(db, config);
			pageParams["page"] = "search"; pageParams["gallery"] = gallery; pageParams["optionalFields"] = config.site.optionalFields[galleryIndex]; 
			pageParams["searchParams"] = searchParams;
			searchObj.doSearch(gallery,searchParams,config.site.optionalFields[galleryIndex],"1",{})
			         .then((result) => { 
			        	 				 if (!hasValue(result)) result = {};
			        	                 console.log(JSON.stringify(result));
			        	                 if (result["count"] == 0) { pageParams["errorMsg"] = "No results for search parameters"; }
			        	                 pageParams["searchResults"] = result; 
			        	                 return res.render('search',pageParams); 
			        	               })
			         .catch((err) => { pageParams["errorMsg"] = err.message; return res.render('index',pageParams); });
		}
	});
	
	app.use('/view',function(req,res) {
		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{}};
		let gallery = getVariable(req,"gallery");
		if (hasValue(gallery)) { pageParams["gallery"] = gallery; }
		if (!hasValue(getVariableParameter(req,"id"))) {
			pageParams["page"] = "index"; pageParams["errorMsg"] = "No id value supplied to /view!";
			return res.render('index',pageParams);
		} else {
			let searchObj = new Search(db,config);
			searchObj.view(getVariableParameter(req,"id"))
			         .then((result) => {
			        	 console.log(JSON.stringify(result));
			        	 pageParams["result"] = result;
			        	 pageParams["page"] = "view";
			        	 if (!hasValue(pageParams["gallery"])) { pageParams["gallery"] = result.gallery; }
			        	 pageParams["optionalFields"] = config.site.optionalFields[config.site.gallerytabs.indexOf(result.gallery)];
			        	 return res.render('view',pageParams);
			         })
			         .catch((err) => { pageParams["errorMsg"] = err.message; return res.render('index',pageParams); });
		}
	});
	
	app.get('/edit',function(req,res) {
		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{}};
		let gallery = getVariable(req,"gallery");
		if (hasValue(gallery)) { pageParams["gallery"] = gallery; }
		if (!hasValue(getVariableParameter(req,"id"))) {
			pageParams["page"] = "index"; pageParams["errorMsg"] = "No id value supplied to /edit!";
			return res.render('index',pageParams);
		} else {
			let searchObj = new Search(db,config);
			searchObj.view(getVariableParameter(req,"id"))
			         .then((result) => {
			        	 console.log(JSON.stringify(result));
			        	 pageParams["result"] = result;
			        	 pageParams["page"] = "edit";
			        	 if (!hasValue(pageParams["gallery"])) { pageParams["gallery"] = result.gallery; setSessionVariable(req,"gallery",result.gallery);}
			        	 pageParams["optionalFields"] = config.site.optionalFields[config.site.gallerytabs.indexOf(result.gallery)];
			        	 return res.render('edit',pageParams);
			         })
			         .catch((err) => { pageParams["errorMsg"] = err.message; return res.render('index',pageParams); });
		}
	});
	
	app.post('/edit',function(req,res) {
		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{}};
		let gallery = getVariable(req,"gallery");
		if (!hasValue(gallery)) {
			pageParams["page"] = "index"; pageParams["gallery"] = "Select"; pageParams["errorMsg"] = "No gallery selected!";
			return res.render('index',pageParams);
		} else {
			let galleryIndex = config.site.gallerytabs.indexOf(gallery);
			if (galleryIndex === -1) {
				pageParams["page"] = "index"; pageParams["gallery"] = "Select"; pageParams["errorMsg"] = "Invalid gallery!";
				return res.render('index',pageParams);
			}
			if (!hasValue(getVariableParameter(req,"id"))) {
				pageParams["page"] = "index"; pageParams["gallery"] = gallery; pageParams["errorMsg"] = "No id value supplied to /edit!";
				return res.render('index',pageParams);
			} else {
				pageParams["gallery"] = gallery;
				let editObj = new Edit(db);
				let updateParams = getSearchParameters(req,config.site.optionalFields[galleryIndex]);
				editObj.update(getVariableParameter(req,"id"),updateParams,config.site.optionalFields[galleryIndex])
				       .then((result) => { 
				    	   pageParams["result"] = result; pageParams["optionalFields"] = config.site.optionalFields[galleryIndex]; pageParams["page"] = "edit";
				    	   if (!"files" in req) {
				    		   return new Promise((resolve) => { resolve(pageParams["result"]) });
				    	   } else {
				    		   if ("file" in req.files) {
				    			   let fileObj = new Files(db);
				    			   return fileObj.addFromForm(getVariableParameter(req,"id"),req.files["file"]);
				    		   } else if (hasValue(getVariableParameter(req,"thumbnailUrl"))) {
				    			   let fileObj = new Files(db);
				    			   return fileObj.addFromURL(getVariableParameter(req,"id"),getVariableParameter(req,"thumbnailUrl"));
				    		   } else {
				    			   return new Promise((resolve) => { resolve(pageParams["result"]) });
				    		   }
				    	   }
				       })
  			           .then((result) => {
  			        	   pageParams["result"] = result;
				    	   return res.render('edit',pageParams);
				       })
				       .catch((err) => { pageParams["errorMsg"] = err.message; 
				                         pageParams["result"] = updateParams; pageParams["result"]["optionalFields"] = updateParams;
				                         pageParams["result"]["_id"] = getVariableParameter(req,"id");
				                         pageParams["optionalFields"] = config.site.optionalFields[galleryIndex];
				                         return res.render('edit',pageParams);
				                       });
			}
		}
	});
	
	app.use('/image',function(req,res) {
		let imageId = getVariableParameter(req,"id");
		if (!hasValue(imageId)) {
		    res.status(404);
		    console.log("Bad imageId in /image: " + imageId);
		    return res.send('404: File Not Found');
		} else {
			let fileObj = new Files(db);
			fileObj.getThumbnailName(imageId)
			       .then((imageName) => {
			    	   return res.sendFile(path.join(__dirname, "../images/", imageId.substring(0,7), imageName));
			       })
			       .catch((err) => {
			    	   console.log(err.message);
			    	   res.status(404);
			    	   return res.send('404: File Not Found');
			       });
		}
	});
	
	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
	  var err = new Error('Not Found');
	  err.status = 404;
	  next(err);
	});
	
	// error handler
	app.use(function(err, req, res, next) {
	  // render the error page
	  res.status(err.status || 500);
	  res.render('error', {status:err.status, message:err.message});
	});
	
};

function getVariable(req,varName) {
	if (varName in req.session) {
		return req.session[varName];
	} else if (varName in req.body) {
		return req.body[varName];
	} else if (varName in req.query) {
		return req.query[varName];
	}
	return null;
}

function getVariableParameter(req,varName) {
	if (varName in req.body) {
		return req.body[varName];
	} else if (varName in req.query) {
		return req.query[varName];
	}
	return null;
}

function getSessionVariable(req,varName) {
	if (varName in req.session) {
		return req.session[varName];
	} else {
		return null;
	}
}

function setSessionVariable(req,varName,varValue) {
	req.session[varName] = varValue;
}

function clearSessionVariable(req,varName) {
	delete req.session[varName];
}

function hasValue(varValue) {
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

function getSearchParameters(req, optionalFields) {
	let searchParams = {};
	if (getVariableParameter(req,"title")) {
		searchParams["title"] = getVariableParameter(req,"title");
	}
	if (getVariableParameter(req,"description")) {
		searchParams["description"] = getVariableParameter(req,"description");
	}
	for (let x=0;x<optionalFields.length;x++) {
		let field = optionalFields[x];
		if (getVariableParameter(req,field.name)) {
			searchParams[field.name] = getVariableParameter(req,field.name);
			// if it's supposed to be an array, make it one if it has only one value
			if (field.type === "checkbox" || field.type === "taglist") {
				if (!((searchParams[field.name]).constructor === Array)) {
					searchParams[field.name] = [searchParams[field.name]];
				}
			}
		}
	}
	return searchParams;
}