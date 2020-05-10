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

config.site = {};

config.site.gallerytabs = ["Main"];

config.site.optionalFields = [
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

module.exports = config;