var db = (function (){
  return function (client){
    this._offset = 0;
    this._limit = 100;
    this._index = 'myndasofn';
    this._filtered = false;
    this._type = 'image';
    this._query = { };

    /**
     * elasticsearch Query
     * @param  {object} object - Elasticsearch object query
     * @return {object}        - This class
     */
    this.query = function (object){
      this._query = {
        query : object
      };
      return this;
    };

    /**
     * Query string to query for
     * @param  {string} string    - Query string to query for
     * @param  {array} fields     - What fields to search in
     * @param  {string} default_field - What fields to match, default _all
     * @return {object}               - This class
     */
    this.query_string = function (string, fields, default_field){
      if(!string){

        return this;
      }
      default_field = default_field || '_all';
      fields = fields || false;
      this._query = {
        query_string : {
          query : string,
          default_field : default_field,
          default_operator : 'AND',
          fuzzy_prefix_length : 3
        }
      };
      if(fields){
        this._query.query_string.fields = fields;
      }
      return this;
    };

    /**
     * Adds filter to Elasticsearch query, if query then adds til filtered query
     * @param  {object} object - filter object
     * @param  {bool}   cache - cache or not?
     * @return {object}        this class
     */
    this.filter = function (object, cache){
      if(!object){
        return this;
      }
      this._filtered = true;
      cache = cache || true;
      var q =  this._query.query;
      var qs = this._query.query_string;
      var wq = this._query.wildcard;

      this._query.filtered = {
        filter : {
            bool : object
        } //,
      //  _cache : cache
      };
      if(q){
        delete this._query.query;
        this._query.filtered.query = q;
      }
      if(qs){
        delete this._query.filtered.filter;
        delete this._query.query_string;
        this._query.filtered.query = {
          query_string : qs,
          constant_score : {
            filter : object
          }
        };
      }
      if(wq){
        delete this._query.wildcard;
        this._query.filtered.query = {
          wildcard : wq
        };
      }
      return this;
    };
    /**
     * Executes query agains elasticsearch
     * @param  {[string]} index - index to query for
     * @param  {[string]} type - Type to query for
     * @return {promise}    Promise
     */
    this.exec = function (index, type){
      this._index = (index) ? index : this._index;
      this._type  = (type) ? type : this._type;
      var body = {};
      var search = {
  		    index: this._index,
  		    from : this._offset,
  		    size : this._limit,
  		    type : this._type,
  		    body: {
  		    	query : this._query
  		    }
  		  };
        console.log(JSON.stringify(search, null, 2));
        // console.log(JSON.stringify(this._query, null, 2));
        //return new Promise(function (resolve, reject){
          return client.search(search);
        //});
    };
    /**
     * Query limit
     * @param  {int} int    Number of hits to limit
     * @return {object}     this class
     */
    this.limit = function (int){
      if(isNaN(parseInt(int))){
        console.warn(int + ' is not a number');
      }else{
        this._limit = int;
      }
      return this;
    };
    /**
     * Query offset
     * @param {int} int Number for row offset
     */
    this.offset = function (int){
      if(isNaN(parseInt(int))){
        console.warn(int + ' is not a number');
      }else{
        this._offset = int;
      }
      return this;
    };
    /**
     * Adds fileds to Elasticsearch query
     * @param  {Array} array Array of filds
     * @return {object}       this class of object
     */
    this.fields = function (array){
      if(Array.isArray(array)){
        this._query.fields = array;
      }else{
        console.warn(array + ' is not Array');
      }

      return this;
    };
    /**
     * Adds Elasticsearch wildcard to query
     * @param  {object} object wildcard query
     * @return {object}        this
     */
    this.wildcard = function (object){
      this._query = {
        wildcard : object
      };
      return this;
    };
    this.debug = function (){
      return {
        offset : this._offset,
        limit : this._limit,
        index : this._index,
        filtered : this._filtered,
        type : this._type,
        query : this._query
      };
    };

  }
})();

module.exports = db;
