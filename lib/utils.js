'use strict'

/**
 * Very basic template engine
 * @param  {object} object object with keys
 * @return {[type]}        [description]
 */
String.prototype.format = function (object){
  var string = this.toString();
  for ( var key in object){
    var value = object[key];
    var regex = new RegExp('\{\{' + key + '\}\}', 'g');
    string = string.replace(regex, value);
  }
  return string;
};

/**
 * Loops throug object and checks if it finds key containing string
 * @param  {string} query - Users original query
 * @return {string}       String or False
 */
var contains = function (object, query){
  var key, value, arr=[];
  /*
    Clean up, if ends with asterisk then remove it
    And set query to lower case
   */
  if (query.charAt(query.length-1) == '*'){
    query=query.substring(0,query.length-1).toLowerCase();
  }
  for(key in object){
    value = object[key];
    if(Array.isArray(value)){
      var array = value.filter(function (v){
        if(v.toLowerCase().indexOf(query) !== -1 ){
          return v;
        }
      });
      if(array.length > 0){
        return array[0];
      }
    }else if (typeof value === 'object'){
      var c = contains(value, query);
      if(c){
        return c;
      }
    }else{
      if(value.toString().toLowerCase().indexOf(query) !== -1){
        return value;
      }
    }
  }

  return false;
};

/**
 * Removes duplicates in array or object in array
 * @param  {object} settings - what key to match: { key : 'foo'}
 * @return {array|object}    - Returns the same as the input
 */
Array.prototype.dedupe = function (settings){

  var array = this,
      seen = {},
      out = [],
      len = array.length,
      j = 0, item,
      object = settings.hasOwnProperty('key');
  for (var i = 0; i < len; i++){
    if(object){
      item = array[i][settings.key];
    }else{
      item = array[i];
    }
    if(seen[item] !== 1) {
      seen[item] = 1;

      if(object){
        out[j] = {};
        out[j][settings.key] = item;
      }else{
        out[j] = item;
      }
      j++;
     }
  }
  return out;
};
/**
 * Formats reponse from elasticsearch for web client
 * @return {object} - Object that it returns
 */
var formatResponse = function (obj){
  var response = {
    _total: obj.hits.total,
    _max_score : obj.hits.max_score,
    _took : obj.took,
    hits : obj.hits.hits
  };
  return response;
};

module.exports = {
  formatResponse : formatResponse,
  contains : contains
};
