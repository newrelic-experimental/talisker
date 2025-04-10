/* An accumulatir example 
*
*  This example shows how to use the accumulator to derive combinatroial values.
*  For instance, you may want to know the percentage difference in a value for this 10 minute period compared to the average of the last 6 days at the same period.
*/

const YOUR_ACCOUNT_ID="3934073" // Your account ID ;

const NAMESPACE ="talisker"  ;       // metric details are prefixed with this, best to leave as is
const NEWRELIC_DC = "US";            // datacenter for account - US or EU
const ACCOUNT_ID = YOUR_ACCOUNT_ID;  // Account ID (required if ingesting events)
let INSERT_KEY=typeof $secure !== 'undefined' ? $secure.YOUR_SECURE_CRED_CONTAINING_INSERT_KEY : "YOUR-INGEST-API-KEY"; //use secure credentials if possible!
let QUERY_KEY= typeof $secure !== 'undefined' ? $secure.YOUR_SECURE_CRED_CONTAINING_QUERY_KEY : "YOUR-USER-API-KEY"; //use secure credentials if possible!


// Some constants to derive time windows for some of the example queries

const bucketSize = 1000 * 60 * 10; // 10 minutes
const buffer = 1000 * 60 * 5; //5 minutes (exclude the last 5 minutes of data, it might not have all arrived yet)

const untilTime = Date.now() - buffer; // until 5 minutes ago
const sinceTime = untilTime - bucketSize; // since 15 minutes ago
const metricPrefix = "apiCount10m";

const daysLookBack = 6; // look back over the last 6 days before today
const mainQuery = `FROM Transaction select count(*) as value`;


// Task Setup

const TASKS=[];

/* 
* Build the tasks to query data for each of the previous 7 days
*
* You can query this data with the following query, breaking out each day into its own signal:
*    select latest(talisker.value) from Metric where talisker.id like 'apiCount10m_minus%' facet talisker.id timeseries 
*/ 
for (let i = 1; i <= daysLookBack; i++) {
    const taskUntilTime = untilTime - (1000 * 60 * 60 * 24 * i); // 1 day at a time
    const taskSinceTime = taskUntilTime - bucketSize; 
    TASKS.push({
        "id":`${metricPrefix}_minus_${i}_day`,
        "name":`${metricPrefix}_minus_${i}_day`,
        "accountId":YOUR_ACCOUNT_ID,
        "selector":"value",
        "chaining":"NONE",
        "accumulator":"ADD",
        "ingestType": "metric",
        "query":`${mainQuery} SINCE ${taskSinceTime} until ${taskUntilTime}`,
    })
}

/* 
* Report the value for current 10 minute period as a precentage of the accumulator mean.
*
* This represents how the current value compares as a percentage to the average of the last 6 days at the same time.
* You can query this with the following query: (a postive value, e.g. 43, means that the current values is 43% higher than the average of the last 6 days.)
*    select latest(talisker.value) from Metric where talisker.id like 'apiCount10m_OffsetFromMean' facet talisker.id timeseries 
*/

TASKS.push(    {
    "id":`${metricPrefix}_OffsetFromMean`,
    "name":`${metricPrefix}_OffsetFromMean`,
    "accountId":YOUR_ACCOUNT_ID,
    "selector":"value",
    "chaining":"PERC_DIFF",
    "chainingSource": "ACCUMULATOR",
    "chainingSourceAttr": "mean",
    "ingestType": "metric",
    "query":`${mainQuery} SINCE ${sinceTime} until ${untilTime}`,
});

/* 
* Report the value for today
*
* Its also useful to report todays value, as well as the previous 6. This task adds today.
*
* You can query this data with the following query, breaking out each day into its own signal:
*    select latest(talisker.value) from Metric where talisker.id like 'apiCount10m_minus_0_day' facet talisker.id timeseries
*/
TASKS.push(    {
    "id":`${metricPrefix}_minus_0_day`,
    "name":`${metricPrefix}_minus_0_day`,
    "accountId":YOUR_ACCOUNT_ID,
    "selector":"value",
    "chaining":"NONE",
    "ingestType": "metric",
    "query":`${mainQuery} SINCE ${sinceTime} until ${untilTime}`,
});


/*
* Report the acucumulator values
*
* This task reports the contents of the accumualtor, which contains the count, min, max and mean from the previous 6 days
*
* You can query these values like this:
*   select latest(talisker.value) from Metric where talisker.id like 'apiCount10m_6day%' facet talisker.id timeseries since 15 minutes ago
*
*/
TASKS.push({
    "id":`${metricPrefix}_6day`,
    "name":`${metricPrefix}_6day`,
    "accumulator":"REPORT"
});


//console.log(TASKS);


/*
* End of example-------------
*/
