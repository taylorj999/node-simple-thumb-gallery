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

config.site.itemsPerPage = 12;

config.site.gallerytabs = ["Main","Secondary"];

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



config.site.optionalFields = [mainOptionalFields, mainOptionalFields]

module.exports = config;