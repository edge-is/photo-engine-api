
var utils = {
  /**
   * Take in string as arguments and spits it out as one string;
   */
  Concat : function (){
    var arg, str = '', len = arguments.length;
    for (var i = 0; i < len; i++){
      str += arguments[i];
    }

    return str;
  }
};

module.exports=utils;
