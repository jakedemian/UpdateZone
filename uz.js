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

		UZ_ATTRIBUTE_MODE_VALUE_PERIODIC :			"periodic",
		UZ_ATTRIBUTE_MODE_VALUE_MANUAL : 			"manual",

		UZ_METADATA_VERSION : 						"v0.1",

		// {HOUR (MILITARY)}{MINUTES}.{MONTH}{DAY}{YEAR}
		UZ_METADATA_BUILD : 						"1439.10142016",

		ERR_MISSING_ATTRIBUTE : 					function(id, attr){return "The update zone '" + id + "' is missing the required attribute: " + attr;},


		// MEMBER VARIABLES
		updateZones : [],

		getCtrlFromId : function(id){
			for(var i = 0; i < this.updateZones.length; i++){
				var zone = this.updateZones[i];
				if(!!zone.attributes && zone.attributes[this.UZ_ATTRIBUTE_IDENTIFIER] && zone.attributes[this.UZ_ATTRIBUTE_IDENTIFIER].value == id){
					return zone;
				}
			}

			this.logger.log("warn", "An update zone with id '" + id + "' was not found.");
			return {};
		},

		getUzCtrlId : function(ele){
			return ele.attributes[this.UZ_ATTRIBUTE_IDENTIFIER].value;
		},

		getUzElementSrcUrl : function(id){
			var ele = this.getCtrlFromId(id);
			if(!!ele && !!ele.attributes && !!ele.attributes[this.UZ_ATTRIBUTE_SOURCE]){
				return ele.attributes[this.UZ_ATTRIBUTE_SOURCE].value;
			}
			else{
				this.logger.log("error", "Unable to obtain the source url for update zone: " + id);
			}
			return "";
		},

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
					this.logger.log("error", this.ERR_MISSING_ATTRIBUTE(id, this.UZ_ATTRIBUTE_FREQ));
				}
			}
		},

		logger : {
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
				if(type == "log" && uz.logger.canLog()){
					// log is really a debug behind the scenes
					console.debug("UpdateZone --> " + msg);
				}
				else if(type == "trace" && uz.logger.canTrace()){
					console.trace("UpdateZone Trace:  " + msg);
				}
				else if(type == "warn" && uz.logger.canWarn()){
					console.warn("UZ WARNING:  " + msg);
				}
				else if(type == "error" && uz.logger.canError()){
					console.error("UZ FATAL ERROR:  " + msg);
				}
				else if(uz.logger.canError()){
					uz.logger.log("error", "The requested log type '" + type + "' is not recognized.");
				}
			}
		},

		postUpdate : function(id, response){
			var ele = this.getCtrlFromId(id);

			if(typeof response == "object"){
				response = JSON.stringify(response);
			}

			ele.innerHTML = response;
		},

		update : function(id){
			var ele = this.getCtrlFromId(id);
			var url = this.getUzElementSrcUrl(id);

			$.ajax({
			  type: "GET",
			  url: url,
			  cache: false,
			  success: function(data){
			     uz.postUpdate(id, data);
			  }
			});
		},

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