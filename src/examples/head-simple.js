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

