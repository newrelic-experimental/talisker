/* A simple example 
*
*  This example shows how to query some data and store either as a metric or event. Generally metrics should be preffered as they are more efficient to store and query.
*
*  You may query the metric with `select * from Metric where talisker.id='exampleUniqueAPICount'`
*  You may query the event with `select * from taliskerSample where talisker.id='exampleUniqueAPICount'`
*/

const YOUR_ACCOUNT_ID="3934073" // Your account ID ;

const NAMESPACE ="talisker"  ;       // metric details are prefixed with this, best to leave as is
const NEWRELIC_DC = "US"  ;          // datacenter for account - US or EU
const ACCOUNT_ID = YOUR_ACCOUNT_ID;  // Account ID (required if ingesting events)
let INSERT_KEY=typeof $secure !== 'undefined' ? $secure.YOUR_SECURE_CRED_CONTAINING_INSERT_KEY : "YOUR-INGEST-API-KEY"; //use secure credentials if possible!
let QUERY_KEY= typeof $secure !== 'undefined' ? $secure.YOUR_SECURE_CRED_CONTAINING_QUERY_KEY : "YOUR-USER-API-KEY"; //use secure credentials if possible!


// Some constants to derive time windows for some of the example queries
const bucketSize = 1000 * 60 * 10; // 10 minutes in ms
const buffer = 1000 * 60 * 5; // 5 minutes in ms
const untilTime = Date.now() - buffer; // until 5 minutes ago
const sinceTime = untilTime - bucketSize; // since 10 minutes ago
const sinceTimeMinus1Day = sinceTime - (1000 * 60 * 60 * 24); // since 1 day ago
const untilTimeMinus1Day = untilTime - (1000 * 60 * 60 * 24); // until 1 day ago    


//Task setup -----------------------------------------

const TASKS = [

// Simple example, data collected and stored as a metric
// Query raw: select * from Metric where talisker.id='example1-UniqueAPICountMetric'
// Query value: select latest(talisker.value) from Metric where talisker.id='example1-UniqueAPICountMetric'
{
    "id":"example1-UniqueAPICountMetric",
    "name":"Example 1 Metric - Unique API count",
    "accountId":YOUR_ACCOUNT_ID,
    "selector":"value",
    "ingestType": "metric",
    "query":"FROM Public_APICall select uniqueCount(api) as value since 15 minute ago until 5 minutes ago"
},

// Simple example, data collected and stored as a event
// Query: select latest(value) from taliskerSample where talisker.id='example2-UniqueAPICountEvent'
{
    "id":"example2-UniqueAPICountEvent",
    "name":"Example 2 Event - Unique API count",
    "accountId":YOUR_ACCOUNT_ID,
    "selector":"value",
    "ingestType": "event",
    "query":"FROM Public_APICall select uniqueCount(api) as value since 15 minute ago until 5 minutes ago"
},

// Compare with NRQL example
// query: select latest(talisker.value) from Metric where talisker.id='example3-CompareWithYesterday'
{
    "id":"example3-CompareWithYesterday",
    "name":"Example 3 Metric - Compare with yesterday",
    "accountId":YOUR_ACCOUNT_ID,
    "selector":"value",
    "ingestType": "metric",
    "query":"FROM Public_APICall select count(*) as value since 15 minute ago until 5 minutes ago compare with 1 day ago"
},

// Faceted NRQL example
// Note how the facets are automatically added to the metric as dimensions.
// query: select latest(talisker.value) from Metric where talisker.id='example4-FacetCount' facet `talisker.facet.api`
{
    "id":"example4-FacetCount",
    "name":"Example 4 Metric - Facets support",
    "accountId":YOUR_ACCOUNT_ID,
    "selector":"value",
    "ingestType": "metric",
    "query":"FROM Public_APICall select count(*) as value since 15 minute ago until 5 minutes ago facet api limit 10"
},

// Chained tasks example (value)
// The first task gathers the first data point, the second task gather the second data point and records the differnce as a value
// query: select latest(talisker.value) from Metric where talisker.id='example5b-ChainedMetricValueDiff'
{
    "id":"example5a-ChainedMetricSrc",
    "name":"Example 5a Metric - Chained metric source",
    "accountId":YOUR_ACCOUNT_ID,
    "selector":"value",
    "ingestType": "metric",
    "query":`FROM Public_APICall select count(*) as value where api='amazonaws.com' since ${sinceTime} until ${untilTime}`
},
{
    "id":"example5b-ChainedMetricValueDiff",
    "name":"Example 5b Metric - Chained metric value differnce",
    "accountId":YOUR_ACCOUNT_ID,
    "selector":"value",
    "ingestType": "metric",
    "chaining": "DIFF",
    "query":`FROM Public_APICall select count(*) as value where api='amazonaws.com' since ${sinceTimeMinus1Day} until ${untilTimeMinus1Day}`
},

// Chained tasks example (percent)
// The first task gathers the first data point, the second task gather the second data point and records the difference as a percentage
// query: select latest(talisker.value) from Metric where talisker.id='example6b-ChainedMetricPercentDiff'
{
    "id":"example6a-ChainedMetricSrc",
    "name":"Example 6a Metric - Chained metric source",
    "accountId":YOUR_ACCOUNT_ID,
    "selector":"value",
    "ingestType": "metric",
    "query":`FROM Public_APICall select count(*) as value where api='amazonaws.com' since ${sinceTime} until ${untilTime}`
},
{
    "id":"example6b-ChainedMetricPercentDiff",
    "name":"Example 6b Metric - Chained metric percent difference",
    "accountId":YOUR_ACCOUNT_ID,
    "selector":"value",
    "ingestType": "metric",
    "chaining": "PERC_DIFF",
    "query":`FROM Public_APICall select count(*) as value where api='amazonaws.com' since ${sinceTimeMinus1Day} until ${untilTimeMinus1Day}`
},
];



/*
* End of example-------------
*/


// Configurations - You shouldnt need to adjust these
const TALISKER_VERSION="2"
const VERBOSE_LOG=true          // Control how much logging there is
const DEFAULT_TIMEOUT = 30000    // You can specify a timeout for each task
const NRQL_TIMEOUT = 20; // nrql timeout

const MONITOR_ID = typeof $env !== 'undefined' ? $env.MONITOR_ID : 'Unknown';   //the monitor id, only relevant if deploying more than once to differentiate
const INGEST_EVENT_ENDPOINT = NEWRELIC_DC === "EU" ? "insights-collector.eu01.nr-data.net" : "insights-collector.newrelic.com" 
const INGEST_METRIC_ENDPOINT = NEWRELIC_DC === "EU" ? "metric-api.eu.newrelic.com" : "metric-api.newrelic.com" 
const GRAPHQL_ENDPOINT = NEWRELIC_DC === "EU" ? "api.eu.newrelic.com" : "api.newrelic.com" 
const INGEST_EVENT_TYPE=`${NAMESPACE}Sample` //events are stored in the eventtype


// End head.

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




// Main Talisker Code --------------------------

// This is the compressed/uglified script. If you need the uncompessed version, see the src/preamble-src.js file.


let assert=require("assert"),_=require("lodash"),ACCUMULATOR={value:0,count:0,max:0,min:0,mean:0},log=function(e,t){(VERBOSE_LOG||t)&&console.log(e)};async function asyncForEach(t,a){for(let e=0;e<t.length;e++)await a(t[e],e,t)}function isObject(e){return null!==e&&("function"==typeof e||"object"==typeof e)}let genericServiceCall=function(e,o,n){"timeout"in o||(o.timeout=DEFAULT_TIMEOUT);let c="number"==typeof e?[e]:e;return new Promise((r,s)=>{$http(o,function(e,t,a){e?(console.log("Request error:",e),console.log("Response:",t),console.log("Body:",a),s(`Connection error on url '${o.url}'`)):c.includes(t.statusCode)?r(n(a,t,e)):(a=`Expected [${c}] response code but got '${t.statusCode}' from url '${o.url}'`,s(a))})})},setAttribute=function(e,t){RUNNING_LOCALLY||$util.insights.set(e,t)},sendDataToNewRelic=async e=>{var t={url:`https://${INGEST_METRIC_ENDPOINT}/metric/v1`,method:"POST",headers:{"Api-Key":INSERT_KEY},body:JSON.stringify(e)};return log(`
Sending ${e[0].metrics.length} records to NR metrics API...`),genericServiceCall([200,202],t,(e,t,a)=>!a||(log(`NR Post failed : ${a} `,!0),!1))},sendEventDataToNewRelic=async e=>{var t={url:`https://${INGEST_EVENT_ENDPOINT}/v1/accounts/${ACCOUNT_ID}/events`,method:"POST",headers:{"Api-Key":INSERT_KEY},body:JSON.stringify(e)};return log(`
Sending ${e.length} records to NR events API...`),genericServiceCall([200,202],t,(e,t,a)=>!a||(log(`NR Post failed : ${a} `,!0),!1))};async function runtasks(e){let s=0,C=0,E=0,h=[],o=[],n=[],v=0,c=Math.round(Date.now()/1e3),T=(e,t,a)=>{let r={};r[NAMESPACE+".id"]=e.id,r[NAMESPACE+".name"]=e.name,r[NAMESPACE+".inverted"]=!0===e.invertResult,a&&(r[NAMESPACE+".faceted"]=!0,r=Object.assign(r,a)),e.ingestType&&"event"===e.ingestType?(a={eventType:INGEST_EVENT_TYPE,name:NAMESPACE+".value",value:t,timestamp:c},a=Object.assign(a,r),n.push(a)):(e={name:NAMESPACE+".value",type:"gauge",value:t,timestamp:c,attributes:r},o.push(e))};return await asyncForEach(e,async m=>{var e;if(m.query&&""!==m.query&&(e=`{
                actor {
                account(id: ${m.accountId}) {
                    nrql(query: "${m.query}", timeout: ${NRQL_TIMEOUT}) {
                    results
                    metadata {
                        facets
                    }
                    }
                }
                }
            }
            `,e={url:`https://${GRAPHQL_ENDPOINT}/graphql`,method:"POST",headers:{"Content-Type":"application/json","API-Key":QUERY_KEY},body:JSON.stringify({query:e})},s++,log(`
[Task ${m.id}]---------------`),await genericServiceCall([200],e,e=>e).then(r=>{try{let s,e=(s=isObject(r)?r:JSON.parse(r),{}),t=null;var o=s.data.actor.account.nrql.results;if(o[0].hasOwnProperty("comparison"))if(o[0].hasOwnProperty("facet")){var n=o.filter(e=>"current"===e.comparison),c=o.filter(e=>"previous"===e.comparison);let r=[];n.forEach(e=>{let t="",a={};Array.isArray(e.facet)?(t=e.facet.join("-"),e.facet.forEach((e,t)=>{a[NAMESPACE+".facet."+t]=e})):(t=e.facet,a[NAMESPACE+".facet"]=e.facet),r.push({facetName:t,facets:a,current:_.get(e,m.selector)})}),c.forEach(e=>{let t=Array.isArray(e.facet)?e.facet.join("-"):e.facet;var a=r.find(e=>e.facetName===t);a&&(a.previous=_.get(e,m.selector),a.value=(a.current-a.previous)/a.previous*100)});var l=r.filter(e=>e.hasOwnProperty("value"));l.length!==r.length&&(console.log(`Not all current and previous records had valid values for both, ${r.length-l.length} of them were dropped`),console.log(r)),t=l}else{var i=_.get(o.find(e=>"previous"===e.comparison),m.selector),u=_.get(o.find(e=>"current"===e.comparison),m.selector);t=(u-i)/i*100}else t=s.data.actor.account.nrql.metadata&&s.data.actor.account.nrql.metadata.facets&&0<s.data.actor.account.nrql.metadata.facets.length?s.data.actor.account.nrql.results.map(a=>{let r={};s.data.actor.account.nrql.metadata.facets.forEach((e,t)=>{1<s.data.actor.account.nrql.metadata.facets.length?null!==a.facet[t]&&(r[NAMESPACE+".facet."+e]=a.facet[t]):null!==a.facet&&(r[NAMESPACE+".facet."+e]=a.facet)});var e=_.get(a,m.selector);return null==e&&console.log(`Error: Selector '${m.selector}' was not found in `+JSON.stringify(a)),{value:e,facets:r}}):(e=s.data.actor.account.nrql.results[0],_.get(e,m.selector));let a=e=>{let t=e;return null===e&&(t=void 0!==m.fillNullValue?m.fillNullValue:0),t=void 0!==e&&!0===m.invertResult?0-e:t};if(Array.isArray(t))t=t.map(e=>(e.value=a(e.value),e));else{if(void 0!==(t=a(t))&&m.accumulator&&"NONE"!=m.accumulator){switch(log(`Accumulator mode [${m.accumulator}]: current result: `+t),m.accumulator){case"ADD":ACCUMULATOR.value+=t,ACCUMULATOR.count++;break;case"SUBTRACT":ACCUMULATOR.value-=t,ACCUMULATOR.count++}ACCUMULATOR.max=1==ACCUMULATOR.count?t:Math.max(ACCUMULATOR.max,t),ACCUMULATOR.min=1==ACCUMULATOR.count?t:Math.min(ACCUMULATOR.min,t),ACCUMULATOR.mean=1==ACCUMULATOR.count?t:ACCUMULATOR.value/ACCUMULATOR.count,console.log("Accumulator value",ACCUMULATOR)}if(void 0!==t&&m.chaining&&"NONE"!=m.chaining)if(m.chainingSource&&"ACCUMULATOR"===m.chainingSource){var A=m.chainingSourceAttr||"mean",d=ACCUMULATOR[A];switch(log(`Chaining mode [${m.chaining}]: current result ${t},  ACCUMULATOR ${A} value: `+d),m.chaining){case"PERC_DIFF":var f=(t-d)/d*100;t=f;break;case"DIFF":t-=d}}else switch(log(`Chaining mode [${m.chaining}]: current result: ${t}, previous result: `+v),m.chaining){case"PERC_DIFF":var g=(t-v)/t*100;t=g;break;case"DIFF":t-=v}}void 0!==t?(C++,log("Task succeeded with result: "+(Array.isArray(t)?`(faceted results: ${t.length})`:t)),v=t,Array.isArray(t)?t.forEach(e=>{void 0!==e.value&&T(m,e.value,e.facets)}):T(m,t)):(E++,log(`Task '${m.name}' failed, no field returned by selector '${m.selector}' in json:  `+JSON.stringify(e)))}catch(e){E++,log(`Task '${m.name}' failed JSON parse error: ${e} `,!0),log(JSON.stringify(r),!0),h.push(`'${m.name}' failed JSON parse: ${e} `)}}).catch(e=>{E++,log(`Task '${m.name}' failed with error: ${e} `,!0),h.push(`'${m.name}' failed with error: ${e} `)})),m.accumulator&&"REPORT"===m.accumulator){log(`
[Task ${m.id}]---------------`),console.log("Reporting accumulator values and resetting");for(var[t,a]of Object.entries(ACCUMULATOR)){var r={...m};r.id=r.id+"_"+t,r.name=r.name+"_"+t,T(r,a)}ACCUMULATOR={value:0,count:0,max:0,min:0,mean:0}}}),o&&0<o.length&&((e={attributes:{}}).attributes[NAMESPACE+".monitorId"]=MONITOR_ID,e.attributes["talisker.version"]=TALISKER_VERSION,e=[{common:e,metrics:o}],!0===await sendDataToNewRelic(e)?(setAttribute("nrPostStatus","success"),log("NR Metrics Post successful")):(setAttribute("nrPostStatus","failed"),log("NR Metrics Post failed"))),n&&0<n.length&&(n.forEach(e=>{e[NAMESPACE+".monitorId"]=MONITOR_ID,e["talisker.version"]=TALISKER_VERSION}),!0===await sendEventDataToNewRelic(n)?(setAttribute("nrPostEventStatus","success"),log("NR Events Post successful")):(setAttribute("nrPostEventStatus","failed"),log("NR Events Post failed"))),log(`

-----
Attempted: ${s}, Succeded ${C}, Failed: `+E,!0),setAttribute("tasksAttempted",s),setAttribute("tasksSucceeded",C),setAttribute("tasksFailed",E),setAttribute("tasksSuccessRate",(C/s*100).toFixed(2)),setAttribute("failureDetail",h.join("; ")),E}try{setAttribute("totalTasksConfigured",TASKS.length),runtasks(TASKS).then(e=>{setAttribute("testRunComplete","YES"),0<e?(setAttribute("taskResult","FAILED"),assert.fail("Not all tasks passed or ingest post failed")):(setAttribute("taskResult","SUCCESS"),assert.ok("All tasks passed"))})}catch(e){console.log("Unexpected errors: ",e)}
