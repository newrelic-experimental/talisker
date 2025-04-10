/* Configuration  */

const YOUR_ACCOUNT_ID="1" // Add your accont ID here

const NAMESPACE ="talisker"         // metric details are prefixed with this, best to leave as is
const NEWRELIC_DC = "US"            // datacenter for account - US or EU
const ACCOUNT_ID = YOUR_ACCOUNT_ID; // Account ID for ingest (required if ingesting events)
let INSERT_KEY=typeof $secure !== 'undefined' ? $secure.YOUR_SECURE_CRED_CONTAINING_INSERT_KEY : "YOUR-INGEST-API-KEY"; //use secure credentials if possible!
let QUERY_KEY= typeof $secure !== 'undefined' ? $secure.YOUR_SECURE_CRED_CONTAINING_QUERY_KEY : "YOUR-USER-API-KEY"; //use secure credentials if possible!

// Task Setup ------------------

const TASKS = [
{
    "id":"exampleMetric1",
    "name":"Example Metric",
    "accountId":YOUR_ACCOUNT_ID,
    "selector":"value",
    "ingestType": "metric",
    "query":"FROM Transaction select count(*) as value since 1 hour ago"
}
];


/*
* End of Configuration -------------
*/
