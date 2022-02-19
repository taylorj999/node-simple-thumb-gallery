var validator = require('validator')
   ,path = require('path')
   ,Galleryitem = require('./galleryitem').Galleryitem
   ,Search = require("./search").Search
   ,Edit = require("./edit").Edit
   ,Files = require("./files").Files
   ,DynamicConfig = require("./dynamicConfig").DynamicConfig
   ,ObjectId = require('mongodb').ObjectID;

module.exports = exports = function(app, db, config) {
	"use strict";
	let dynamicConfig = new DynamicConfig(db);
	
	app.get('/',function(req,res) {
		let pageParams = getDefaultPageParams(config, req);
//		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{},"searchPage":""};
		let galleryConfig = dynamicConfig.findGalleryConfigById(config,pageParams["gallery"]);
		if (galleryConfig!=null) {
			pageParams["galleryConfig"] = galleryConfig;
		}
		pageParams["page"] = "index";
		return res.render('index', pageParams);
	});
	
	app.get('/add',function(req,res) {
		let pageParams = getDefaultPageParams(config, req);
//		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{}};
		if (!hasValue(pageParams["gallery"])) {
			pageParams["page"] = "index"; pageParams["gallery"] = "-1"; pageParams["errorMsg"] = "No gallery selected!";
			return res.render('index',pageParams);
		} else {
			let galleryConfig = dynamicConfig.findGalleryConfigById(config,pageParams["gallery"]);
			if (galleryConfig!=null) {
				pageParams["galleryConfig"] = galleryConfig;
			} else {
				pageParams["page"] = "index"; pageParams["gallery"] = "-1"; pageParams["errorMsg"] = "Invalid gallery!";
				return res.render('index',pageParams);
			}
			pageParams["page"] = "add";
			return res.render('add',pageParams);
		}
	});
	
	app.post('/add',function(req,res) {
		let pageParams = getDefaultPageParams(config, req);
//		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{}};
		if (!hasValue(pageParams["gallery"])) {
			pageParams["page"] = "index"; pageParams["gallery"] = "-1"; pageParams["errorMsg"] = "No gallery selected!";
			return res.render('index',pageParams);
		} else {
			let galleryConfig = dynamicConfig.findGalleryConfigById(config,pageParams["gallery"]);
			if (galleryConfig!=null) {
				pageParams["galleryConfig"] = galleryConfig;
			} else {
				pageParams["page"] = "index"; pageParams["gallery"] = "-1"; pageParams["errorMsg"] = "Invalid gallery!";
				return res.render('index',pageParams);
			}
			let addParams = getSearchParameters(req,galleryConfig.optionalFields);
			let galleryItem = new Galleryitem(db);
			pageParams["optionalFields"] = galleryConfig.optionalFields;
			galleryItem.addGalleryItem(pageParams["gallery"],addParams,galleryConfig.optionalFields)
			           .then(result => { 
			        	   let searchObj = new Search(db,config);
			        	   return searchObj.view(result)
			           })
			           .then((result) => {
			   			   if (config.system.debug) console.log(JSON.stringify(result));
			   			   pageParams["result"] = result; pageParams["page"] = "edit"; pageParams["imageUrl"] = "";
			   			   return res.render('edit',pageParams);
			           })
			           .catch(err => { pageParams["errorMsg"] = err.message; return res.render('index',pageParams)});
		}		
	});
	
	app.use('/search',function(req,res) {
		let pageParams = getDefaultPageParams(config, req);
//		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{},"searchPage":""};
		if (!hasValue(pageParams["gallery"])) {
			pageParams["page"] = "index"; pageParams["gallery"] = "-1"; pageParams["errorMsg"] = "No gallery selected!";
			return res.render('index',pageParams);
		} else {
			let galleryConfig = dynamicConfig.findGalleryConfigById(config,pageParams["gallery"]);
			if (galleryConfig!=null) {
				pageParams["galleryConfig"] = galleryConfig;
			} else {
				pageParams["page"] = "index"; pageParams["gallery"] = "-1"; pageParams["errorMsg"] = "Invalid gallery!";
				return res.render('index',pageParams);
			}
			let searchPage = getVariableParameter(req,"searchPage");
			if (!hasValue(searchPage)) { searchPage = "1"; }
			let searchParams = {};
			if (getVariableParameter(req,"search") && getVariableParameter(req,"search") === "new") {
				clearSessionVariable(req,"searchParams");
				searchParams = getSearchParameters(req,galleryConfig.optionalFields);
				searchPage = "1";
				setSessionVariable(req,"searchParams",searchParams);
			} else if (hasValue(getSessionVariable(req,"searchParams"))){
				searchParams = getSessionVariable(req,"searchParams");
			}
//			console.log(JSON.stringify(searchParams));
			let searchObj = new Search(db, config);
			pageParams["page"] = "search";  pageParams["optionalFields"] = galleryConfig.optionalFields; 
			pageParams["searchParams"] = searchParams; pageParams["params"]["searchPage"] = searchPage;
			searchObj.doSearch(pageParams["gallery"],searchParams,galleryConfig.optionalFields,searchPage,{})
			         .then((result) => {
			        	 				 if (!hasValue(result)) result = {};
			        	 				 if (config.system.debug) console.log(JSON.stringify(result));
			        	                 if (result["count"] == 0) { pageParams["errorMsg"] = "No results for search parameters"; }
			        	                 pageParams["searchResults"] = result; 
			        	                 return res.render('search',pageParams); 
			        	               })
			         .catch((err) => { pageParams["errorMsg"] = err.message; return res.render('index',pageParams); });
		}
	});
	
	app.use('/view',function(req,res) {
		let pageParams = getDefaultPageParams(config, req);
//		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{}};
		if (!hasValue(getVariableParameter(req,"id"))) {
			pageParams["page"] = "index"; pageParams["errorMsg"] = "No id value supplied to /view!";
			return res.render('index',pageParams);
		} else {
			let searchObj = new Search(db,config);
			searchObj.view(getVariableParameter(req,"id"))
			         .then((result) => {
			        	 if (config.system.debug) console.log(JSON.stringify(result));
			        	 pageParams["result"] = result;
			        	 pageParams["page"] = "view";
			        	 if (!hasValue(pageParams["gallery"])) { pageParams["gallery"] = result.gallery; }
			 			 let galleryConfig = dynamicConfig.findGalleryConfigById(config,pageParams["gallery"]);
			 			 if (galleryConfig!=null) {
							pageParams["galleryConfig"] = galleryConfig;
			        	    pageParams["optionalFields"] = galleryConfig.optionalFields;
			 			 }
			        	 return res.render('view',pageParams);
			         })
			         .catch((err) => { pageParams["errorMsg"] = err.message; return res.render('index',pageParams); });
		}
	});
	
	app.get('/config',function(req,res) {
		let pageParams = getDefaultPageParams(config, req);
		return res.render('config',pageParams);
	});
	
	app.post('/config', function(req,res) {
		let pageParams = getDefaultPageParams(config, req);
		
		let galleryId = null;
		
		if (!hasValue(getVariableParameter(req,"galleryId"))) {
			pageParams["errorMsg"] = "Invalid form submission - could not find gallery id";
		} else if (getVariableParameter(req,"galleryId") == "NEW") {
			galleryId = new ObjectId().toString();
		} else {
			galleryId = getVariableParameter(req,"galleryId");
		}
		
		let updateGalleryOptions = {"_id": galleryId, "galleryName": "Default", "galleryVisible": true, "optionalFields": []};
		updateGalleryOptions.galleryName = getVariableParameter(req,"galleryName");
		if (hasValue(getVariableParameter(req,"galleryVisible"))) updateGalleryOptions.galleryVisible = true;
		else updateGalleryOptions.galleryVisible = false;
		
		let tempOptionalFields = {};
		
		for (var propName in req.body) {
	        if (propName.startsWith("optionalFields_")) {
	        	const propArray = propName.split("_");
	        	const fieldName = propArray[1];
	        	const fieldVar = propArray[2];
	        	if (!hasValue(tempOptionalFields[fieldName])) tempOptionalFields[fieldName] = {"name":fieldName};
	        	if (fieldVar=="options") {
		        	tempOptionalFields[fieldName][fieldVar] = JSON.parse(req.body[propName]);
	        	} else {
	        		tempOptionalFields[fieldName][fieldVar] = req.body[propName];
	        	}
	        }
		}
		
		for (var fieldName in tempOptionalFields) {
			if (tempOptionalFields[fieldName]["name"].length > 0) {
				updateGalleryOptions["optionalFields"].push(tempOptionalFields[fieldName]);
			}
		}
		
		console.log(JSON.stringify(updateGalleryOptions));
		
		dynamicConfig.updateConfig(config, galleryId, updateGalleryOptions)
		             .then((updatedConfig) => {
		            	 config = updatedConfig;
		            	 pageParams["config"] = config.site;
		            	 return res.render('config',pageParams);
		             })
		             .catch((err) => {
		            	 console.log(err);
		            	 pageParams["errorMsg"] = "Error updating configuration information - see server logs";
		            	 return res.render('config',pageParams);
		             });
	});
	
	app.get('/edit',function(req,res) {
		let pageParams = getDefaultPageParams(config, req);
//		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{}};
		if (!hasValue(getVariableParameter(req,"id"))) {
			return renderIndexPageForError(res,"No id value supplied to /edit!",pageParams);
		} else {
			let searchObj = new Search(db,config);
			searchObj.view(getVariableParameter(req,"id"))
			         .then((result) => {
			        	 if (config.system.debug) console.log(JSON.stringify(result));
			        	 pageParams["result"] = result;
			        	 pageParams["page"] = "edit";
			        	 if (!hasValue(pageParams["gallery"])) { pageParams["gallery"] = result.gallery; setSessionVariable(req,"gallery",result.gallery);}
			        	 
			 			 let galleryConfig = dynamicConfig.findGalleryConfigById(config,pageParams["gallery"]);
			 			 if (galleryConfig!=null) {
							pageParams["galleryConfig"] = galleryConfig;
			        	    pageParams["optionalFields"] = galleryConfig.optionalFields;
			 			 }
			        	 if (hasValue(getVariableParameter(req,"imageUrl"))) { pageParams["imageUrl"] = getVariableParameter(req,"imageUrl"); } else { pageParams["imageUrl"] = ""; }
			        	 return res.render('edit',pageParams);
			         })
			         .catch((err) => { return renderIndexPageForError(res,err.message,pageParams); });
		}
	});
	
	app.post('/edit',function(req,res) {
		let pageParams = getDefaultPageParams(config, req);		
//		let pageParams = {"page":"","errorMsg":"","gallery":"","galleries":config.site.gallerytabs,"optionalFields":{},"imageUrl":""};
		if (!hasValue(pageParams["gallery"])) {
			pageParams["gallery"] = "-1";
			return renderIndexPageForError(res,"No gallery selected!",pageParams);
		} else {
 			 let galleryConfig = dynamicConfig.findGalleryConfigById(config,pageParams["gallery"]);
 			 if (galleryConfig!=null) {
				pageParams["galleryConfig"] = galleryConfig;
        	    pageParams["optionalFields"] = galleryConfig.optionalFields;
 			 } else {
				pageParams["page"] = "index"; pageParams["gallery"] = "-1"; pageParams["errorMsg"] = "Invalid gallery!";
				return res.render('index',pageParams);
			}
			if (!hasValue(getVariableParameter(req,"id"))) {
				pageParams["page"] = "index"; pageParams["errorMsg"] = "No id value supplied to /edit!";
				return res.render('index',pageParams);
			} else {
				let editObj = new Edit(db);
				let updateParams = getSearchParameters(req,galleryConfig.optionalFields);
				editObj.update(getVariableParameter(req,"id"),updateParams,galleryConfig.optionalFields)
				       .then((result) => { 
				    	   pageParams["result"] = result; pageParams["optionalFields"] = galleryConfig.optionalFields; pageParams["page"] = "edit";
				    	   if (!"files" in req) {
				    		   return new Promise((resolve) => { resolve(pageParams["result"]) });
				    	   } else {
				    		   if ("file" in req.files) {
				    			   let fileObj = new Files(db);
				    			   return fileObj.addFromForm(getVariableParameter(req,"id"),req.files["file"]);
				    		   } else if (hasValue(getVariableParameter(req,"thumbnailUrl"))) {
				    			   pageParams["imageUrl"] = getVariableParameter(req,"thumbnailUrl"); // recover imageUrl in case of loader error
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

function renderIndexPageForError(res,error,pageParams) {
	pageParams["page"] = "index"; pageParams["errorMsg"] = error; pageParams["searchPage"] = "";
	return res.render('index',pageParams);
}

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
	if (req.body === undefined) { console.log("Invalid value in request object"); return null; }
	
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

function getGalleryParam(req) {
	let gallery = getVariableParameter(req,"gallery");
	if (!hasValue(gallery)) {
		gallery = getSessionVariable(req,"gallery");
	} else {
		setSessionVariable(req,"gallery",gallery);
	}
	if (!hasValue(gallery)) return "";
	else return gallery;
}

function getDefaultPageParams(config, req) {
	let pageParams = {
		"page":"",
		"errorMsg":"",
		"gallery":getGalleryParam(req),
		"galleryConfig":{},
		"config":config.site,
		"optionalFields":{},
		"params": {
		}
	};
	return pageParams;
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
			if (field.type === "checkbox") {
				if (!((searchParams[field.name]).constructor === Array)) {
					searchParams[field.name] = [searchParams[field.name]];
				}
			} else if (field.type === "arblist" || field.type === "taglist") {
				searchParams[field.name] = JSON.parse(searchParams[field.name]);
			}
		}
	}
	return searchParams;
}