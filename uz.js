/* 
	Most of this loadJquery() function was taken from Sam Deering's article: Dynamically Load jQuery Library Using Plain JavaScript:
	src:  https://www.sitepoint.com/dynamically-load-jquery-library-javascript/
*/
function loadJquery(url, callback) {

	if(typeof jQuery == "undefined"){
	    var script = document.createElement("script")
	    script.type = "text/javascript";

	    if (script.readyState) { //IE
	        script.onreadystatechange = function () {
	            if (script.readyState == "loaded" || script.readyState == "complete") {
	                script.onreadystatechange = null;
	                callback();
	            }
	        };
	    } else { //Others
	        script.onload = function () {
	            callback();
	        };
	    }

	    script.src = url;
	    document.getElementsByTagName("head")[0].appendChild(script);
	}
	else{
		callback();
	}
}

loadJquery("https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js", function () {
	window.uz = {

		// CONSTANTS
		UZ_ATTRIBUTE_IDENTIFIER : 					"uz-id",
		UZ_ATTRIBUTE_MODE : 						"uz-mode",
		UZ_ATTRIBUTE_FREQ : 						"uz-freq",
		UZ_ATTRIBUTE_SOURCE : 						"uz-src",
		UZ_ATTRIBUTE_PARAM : 						"uz-param",
		UZ_ATTRIBUTE_DATA : 						"uz-data",

		UZ_ATTRIBUTE_MODE_VALUE_PERIODIC :			"periodic",
		UZ_ATTRIBUTE_MODE_VALUE_MANUAL : 			"manual",

		UZ_METADATA_VERSION : 						"v0.1",

		// {HOUR (MILITARY)}{MINUTES}.{MONTH}{DAY}{YEAR}
		UZ_METADATA_BUILD : 						"1439.10142016",

		ERR_MISSING_ATTRIBUTE : 					function(id, attr){return "The update zone '" + id + "' is missing the required attribute: " + attr;},
		setLogLevel : 								function(lvl){uzlogger.currentLogLevel = lvl;},

		// MEMBER VARIABLES
		updateZones : [],

		/**
		* Get an update zone object from a provided identifier.
		* @param id 	The id of the update zone we want.
		*/
		getCtrlFromId : function(id){
			for(var i = 0; i < this.updateZones.length; i++){
				var zone = this.updateZones[i];
				if(!!zone.attributes && zone.attributes[this.UZ_ATTRIBUTE_IDENTIFIER] && zone.attributes[this.UZ_ATTRIBUTE_IDENTIFIER].value == id){
					return zone;
				}
			}

			uzlogger.log("warn", "An update zone with id '" + id + "' was not found.");
			return {};
		},

		/**
		* Obtain the id of an update zone.
		* @param ele 	The update zone we want the id from.
		*/
		getUzCtrlId : function(ele){
			return ele.attributes[this.UZ_ATTRIBUTE_IDENTIFIER].value;
		},

		/**
		* Checks whether a update zone contains a particular attribute.
		* @param id 	The identifier of the update zone.
		* @param attr 	The attribute we want to check for.
		*/
		uzCtrlHasAttribute : function(id, attr){
			var ele = this.getCtrlFromId(id);
			return !!ele.attributes[attr];
		},

		/**
		* Obtains the value of a specific attribute for an update zone.
		* @param ele 	The update zone.
		* @param attr 	The attribute we want to check for.
		*/
		getUzAttrValue : function(ele, attr){
			if(!!ele && !!ele.attributes && !!ele.attributes[attr]){
				return ele.attributes[attr].value;
			}
			else{
				uzlogger.log("log", "The attribute '" + attr + "' was not found for the update zone '" + this.getUzCtrlId(ele) + "'.");
			}
			return null;
		},

		/**
		* Obtains an array of key-value pairs from the uz-param attribute of a given update zone.
		* @param id 	The update zone to obtain params from.
		*/
		getUzElementParams : function(id){
			var ele = this.getCtrlFromId(id);
			var paramKeyValueString = this.getUzAttrValue(ele, this.UZ_ATTRIBUTE_PARAM);
			var key = null;
			var value = null;

			if(!paramKeyValueString){
				return null;
			}

			try{
				key = paramKeyValueString.substring( 0, paramKeyValueString.indexOf(':') );
				value = paramKeyValueString.substring(paramKeyValueString.indexOf(':') + 1);
			}
			catch(err){
				uzlogger.log("error", err);
				return null;
			}

			// try to convert to number
			if(isNaN(value) == false){
				value = Number(value);
			}

			// if possible, convert to boolean
			if(value === "true" || value === "false"){
				value = (value === "true");
			}

			// TODO i'll have to return an array of these soon when i add support for a delimited list in the attribute value
			return [{"key":key, "value":value}];
		},

		/**
		* Gets the source url of an update zone.
		* @param id 	The id of the update zone from which we want the source url.
		*/
		getUzElementSrcUrl : function(id){
			var ele = this.getCtrlFromId(id);
			if(!!ele && !!ele.attributes && !!ele.attributes[this.UZ_ATTRIBUTE_SOURCE]){
				return ele.attributes[this.UZ_ATTRIBUTE_SOURCE].value;
			}
			else{
				uzlogger.log("warn", "Unable to obtain the source url for update zone: " + id);
			}
			return "";
		},

		/**
		* Create an array of all update zones who have a specific attribute and attribute value.
		* @param attr 		The name of the attribute.
		* @param value 		The value of the attribute.
		*/
		getUzElementsWithAttributeValue : function(attr, value){
			var eles = [];
			for(var i = 0; i < this.updateZones.length; i++){
				var zone = this.updateZones[i];
				if(!!zone.attributes && !!zone.attributes[attr] && zone.attributes[attr].value == value){
					eles.push(zone);
				}
			}
			return eles;
		},

		/**
		* Create an array of all update zones found in the DOM.
		*/
		getAllUzElements : function(){
			var allElements = $("*");
			var uzElements = [];

			for(var i = 0; i < allElements.length; i++){
				var ele = allElements[i];
				if(!!ele.attributes && !!ele.attributes[this.UZ_ATTRIBUTE_IDENTIFIER]){
					uzElements.push(ele);
				}
			}
			return uzElements;
		},

		/**
		* Initialize all update zones that are set to update periodically.
		*/
		initAllPeriodicZones : function(){
			var periodicZones = this.getUzElementsWithAttributeValue(this.UZ_ATTRIBUTE_MODE, this.UZ_ATTRIBUTE_MODE_VALUE_PERIODIC);
			
			for(var i = 0; i < periodicZones.length; i++){
				// in thoery this will always exist because getAllUzElements() does this check earlier
				var id = periodicZones[i].attributes[this.UZ_ATTRIBUTE_IDENTIFIER].value; 

				if(!!periodicZones[i].attributes[this.UZ_ATTRIBUTE_FREQ]){
					var freq = periodicZones[i].attributes[this.UZ_ATTRIBUTE_FREQ].value;
					window.setInterval(function(){uz.update(id);}, freq);
				}
				else{
					uzlogger.log("error", this.ERR_MISSING_ATTRIBUTE(id, this.UZ_ATTRIBUTE_FREQ));
				}
			}
		},		

		/**
		* Post the retreived content into the update zone.
		* @param ele 		The element that needs to be updated.
		* @param response 	The response from the update zone's AJAX call.
		*/
		postUpdatedContent : function(ele, response){
			if(typeof response == "object"){
				response = JSON.stringify(response);
			}

			// TODO there are a lot of other things that will probably need to be logged here.

			ele.innerHTML = response;
		},

		/**
		* Triggers the specified update zone to fetch new data and then update.
		* @param id The uz-id of the element that should be updated.
		*/
		update : function(id){
			var ele = this.getCtrlFromId(id);
			var url = this.getUzElementSrcUrl(id);
			var data = {};
			
			// data can come from uz-data, or uz-param
			if(this.uzCtrlHasAttribute(id, this.UZ_ATTRIBUTE_DATA)){
				var dataJson = {}
				console.log("TODO extract data json");
				data = dataJson;
			}
			if(this.uzCtrlHasAttribute(id, this.UZ_ATTRIBUTE_PARAM)){
				var params = this.getUzElementParams(id);
				for(var i = 0; i < params.length; i++){
					data[params[i].key] = params[i].value;
				}
			}			

			$.ajax({
			  type: "GET",
			  url: url,
			  data: data,
			  cache: false,
			  success: function(data){
			     uz.postUpdatedContent(ele, data);
			  }
			});
		},

		/**
		 * Initializes all update zones on the page.
		 */
		init : function(){
			this.updateZones = this.getAllUzElements();
			this.initAllPeriodicZones();

			//at the end here, we should update all update zones on the page
			for(var i = 0; i < this.updateZones.length; i++){
				this.update(this.getUzCtrlId(this.updateZones[i]));
			}
		}
	}
	uz.init();
	if(!!console && !!console.log){
		console.log("Update Zone " + uz.version + " (Build " + uz.build + ")");
	}
});

/*
* Main update zone logging object.
*/
uzlogger = {
	levels : {"trace":0, "log":1, "warn":2, "error":3},
	currentLogLevel : 2,

	canLog : function(){
		return !!console && !!console.debug;
	},

	canTrace : function(){
		return !!console && console.trace;
	},

	canWarn : function(){
		return !!console && console.warn;
	},

	canError : function(){
		return !!console && console.error;
	},

	log : function(type, msg){
		if(!this.levels[type] || this.levels[type] < this.currentLogLevel){
			return;
		}

		if(type == "trace" && this.canTrace()){
			console.trace("UpdateZone Trace:  " + msg);
		}
		else if(type == "log" && this.canLog()){
			// log is really a debug behind the scenes
			console.debug("UpdateZone --> " + msg);
		}
		else if(type == "warn" && this.canWarn()){
			console.warn("UZ WARNING:  " + msg);
		}
		else if(type == "error" && this.canError()){
			console.error("UZ FATAL ERROR:  " + msg);
		}
		else if(uz.logger.canError()){
			this.log("error", "The requested log type '" + type + "' is not recognized.");
		}
	}
}
