
var mappings;
var config = require(global.APP_ROOT + '/config.js');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: config.elasticsearch.server
});


mappings = {
  get : function (index, type, callback){
    console.log(index, type)

    client.indices.getMapping({
			index: index,
			type : type
		},function (error, response){
			if (error){
		  		callback(error);
	  	}else{
	  		callback(error, response);
	  	}
	});

  }
};


module.exports = mappings;
