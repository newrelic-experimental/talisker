
/*
*  ========== LOCAL TESTING CONFIGURATION ===========================
*  This section allows you to run the script from your local machine
*  mimicking it running in the new relic environment. Much easier to develop!
*/
let RUNNING_LOCALLY = false;
const IS_LOCAL_ENV = typeof $http === 'undefined';
if (IS_LOCAL_ENV) {  
  RUNNING_LOCALLY=true
  var $http = require("request");       //only for local development testing
  var $secure = {}                      //only for local development testing
  QUERY_KEY="NRAK-.."  //NRAK...
  INSERT_KEY="...FFFFNRAL"  //...NRAL

  console.log("Running in local mode",true)
} 



