
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
