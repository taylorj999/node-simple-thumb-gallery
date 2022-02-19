var config = {};

//system configuration, used to define back end features
//anything that never is required by the display layer goes in here
config.system = {};

config.system.mongoConnectString = 'mongodb://localhost:27017/thumbgallery';
config.system.sessionKey = 'insertyoursecrethere';

config.system.clientId = "";
config.system.clientSecret = "";

config.system.debug = false;

config.system.port = 3013;

//define specific configuration document in the database "config" collection
config.system.dynamicConfigId = null;

config.site = {};

config.site.itemsPerPage = 12;

config.site.defaultGallery = "0";

let mainOptionalFields = [
	{
		"name":"textfield1",
		"display":"Text Field",
		"type":"text"
	},
	{
		"name":"checkbox",
		"display":"Checkbox Field",
		"type":"checkbox",
		"options":["Checkbox 1","Checkbox 2"]
	}
];

config.site.galleries = [
	{"_id":"0","galleryName":"Demo","galleryVisible":true, "optionalFields":mainOptionalFields}
];

module.exports = config;