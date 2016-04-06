var edge_search = {
	config : {

	},
	contains : function (json, query){
		var  value, arr=[];
		if (query.charAt(query.length-1) == '*'){
			query=query.substring(0,query.length-1);
		}
		for( key in json){
			value = json[key];
			if(typeof value == 'array'){
				// array do somthing !
			}else if (typeof value == 'string'){
				if(value.toLowerCase().indexOf(query.toLowerCase()) !== -1){
					return value;
				}
			}else if (typeof value == 'number'){
				value = value.toString();
				if(value.indexOf(query) !==-1){
					return value;
				}
			}

		}
	},
	GetMapping : function (callback){
		var _root = this;
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
		  host: _root.config.elasticsearch.server
		})
		client.indices.getMapping({
			index: _root.config.query.index,
			type : 'image'
		},function (error, response){
			if (error){
		  		callback(error);
		  	}else{
		  		callback(error, response);
		  	}
		});
		// client.search({
		//     index: _root.config.query.index,
		//     type : 'image',
		//     body: {
		//     	query :
		//     }
		//   }, function (error, response) {
		//   	if (error){
		//   		callback(error);
		//   	}else{
		//   		callback(error, response);
		//   	}
		//   });
	},
	pretty : function (data){
		var _root = this;
		var newarr=[];
		data.forEach(function (value, key){
			value._source['$$index'] = value._index;
			value._source['id'] = value.id;
			value._source['$$score'] = value._score;
			value._source['location'] = _root.toen(value._source.safn);
			newarr.push(value._source);
		});
		return newarr;
	},
	ToObject : function (arr){
		var newarr=[];
		arr.forEach(function (value){
			newarr.push({hit:value});
		});
		return newarr;
	},
	clean : function (arr){
		var newarr = [];
		arr.forEach(function (value){
			if(newarr.indexOf(value) === -1) {
				newarr.push(value);
			}
		});
		return newarr;

	},
	search : function (req, callback) {

		if(!req.query.query){
			callback('No query');
			return;
		}

		var _root = this,
			limit = req.query.limit 		? req.query.limit 	: _root.config.query.limit,
  			offset = req.query.offset 		? req.query.offset 	: _root.config.query.offset,
  			operator = req.query.operator 	? req.query.operator : _root.config.query.operator,
  			type = req.query.type,
  			arr=[], x, results = {},
  			filter = req.query.filter ? req.query.filter : { };


		_root._search(req.query.query, limit, offset, function(err, hits){
  			if(!err){
		  		if(type=="bloodhound"){
		  			hits.results.forEach(function (value, key){
		  				x = _root.contains(value._source, req.query.query)
		  				x ? arr.push(x) : false ;
		  			});
		  			arr = _root.clean(arr);
		  			results.data = _root.ToObject(arr)
		  			callback(err, results);
		  		}else{

		  			results.data = _root.pretty(hits.results);
		  			results.total = hits.total;
  					callback(err, results);
		  		}

  			}
  		});
	},
	_search : function (query, limit, offset, callback){
		query = this.CreateQuery(query, false);
		this.elastic_search(query, limit, offset, callback);
	},
    MapAlias : function (query){
		var key,x, _root = this,
		obj =  _root.config.alias.data;
		for(index in obj){
			key = index.toLowerCase();
			obj[key] = obj[index];
		}

		for(index in obj){

			if(query.indexOf(index)!==-1){
				x = new RegExp(index, 'g');
				return query.replace(x, obj[index]);
			}
		}
		return query;

	},
	CreateQuery : function (user_query, fields){
		var _root = this;
		var query = {
				filtered : {
					filter :{
						bool : _root.config.filter
					}
				}
			}

		query.filtered["query"] = {
		 	"query_string" : {
		 		"query" : user_query,
		 		"default_operator" : "AND",
				"fuzzy_prefix_length" : 3
		 	}
		};
		if (fields !== false){
			query['fields'] = fields;
		}

		return query;
	},



	elastic_search : function (q, limit, offset, callback){
		var _root = this;
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
		  host: this.config.elasticsearch.server
		});
		limit = (limit) ? limit : 10;
		client.search({
		    index: _root.config.query.index,
		    from : offset,
		    size : limit,
		    type : 'image',
		    body: {
		    	query : q
		    }
		  }, function (error, response) {
		  	if(error){
		  		//console.log(error, JSON.stringify(q));
		  		callback(error);
		  	}else{
			  	if(+response.hits.total == 0){
			  		response.hits.hits=[];
			  	}
			  	callback(error, {
			  		total : response.hits.total,
			  		results : response.hits.hits
			  		});

		  	}
		  });
	},
	toen : function (str){
		str = str.toLowerCase();
		str = str.replace(/á/g, 'a');
		str = str.replace(/ú/g, 'u');
		str = str.replace(/í/g, 'i');
		str = str.replace(/ó/g, 'o');
		str = str.replace(/ð/g, 'd');
		str = str.replace(/é/g, 'e');
		str = str.replace(/ý/g, 'y');
		str = str.replace(/þ/g, 't');
		str = str.replace(/ö/g, 'o');
		str = str.replace(/æ/g, 'ae');
		str = str.replace(/ /g, '_');
		str = str.replace(/\(/g, '');
		str = str.replace(/\)/g, '');
		str = str.replace(/,/g, '');
		//str = str.replace(/./, '');
		return str;
	}
};

module.exports = edge_search;
