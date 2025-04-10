[![New Relic Experimental header](https://github.com/newrelic/opensource-website/raw/main/src/images/categories/Experimental.png)](https://opensource.newrelic.com/oss-category/#new-relic-experimental)

# Talisker V2 - NRDB NRQL Alerting Engine
The Talisker engine allows you to alert on NRQL queries longer than the 24 hour streaming alerts limit as well as providing other NRQL query features not available in streaming alerts. The engine runs within the New Relic Synthetic Monitor container and can be configured with a simple configuration. This allows you to query against NRDB (data at rest) using any time window span you choose and also combine results from multiple queries. Query results are written back to NRDB where you can alert on them.

Each query is defined as a "task" - the engine will process each task sequentially, recording the result into NRDB. You can also chain tasks together and utilise an accumulator to derive new signal values.

Features include:
- NRQL queries of any time window and functionality (including joins, nested aggregation, etc) supproted
- Compare with supported out of the box
- Facets supported
- Query chaining supported
- Accumulator function allowing min/max/median for multiple signals to be recorded
- Store signal as Metric (preferred) or Event

## Installation and setup
Copy the content of [talisker.js](.talisker.js) into a New Relic Scripted API monitor. Configure with your account details and API keys and define the tasks you wish to run.

> Note: The file [talisker-src.js](talisker-src.js) is also available which includes the full talisker code but uncompressed.

You will need to specify two API keys, one a user key api and one ingest insert key. These are to query and inject the data respectively. We recommend that you store these in the secure credential store.

### Running locally
You can run and test on your local machine. With nodejs installed run `npm install` to install dependencies. Then edit the file accordingly (adding your own API keys where appropriate in the local config section and setting up your tasks manually). Run the script with `node talisker.js` 

## Task configuration
You configure tasks through the TASKS json object. Each task you can specify:

- **id**: A unique id for this task in this task list
- **name**: A more friendly readable name for the task
- **accountId**: The account ID to run the query against
- **query**: The NRQL to run. Its best to name your return value using the `as` operator. e.g. `FROM Public_APICall select count(*) as value since 1 day ago compare with 1 week ago`. Note that `compare with` queries are automatically recognised and the percentage change is returned. Facets are supported, each result will be reported as a seperate metric value with the facet added as an attribute.
- **selector**: The name of the field in the query containing the data. e.g. 'value'. This supports dot notation, e.g to reference the value of `..percentile(duration,95) as duration...` you would set the selector to  `duration.95`
- **accumulator**: NONE, ADD or SUBTRACT - if present the value from the query will be added/subtracted from the accumulator (see below)
- **chaining**: one of:
  - `NONE`: Just return the value from query
  - `DIFF`: Return the difference from the value from this query to the previous task
  - `PERC_DIFF`: Return the difference from the value from this query to the previous task as a percentage
- **chainingSource**: If present and with value "ACCUMULATOR" then chaining srouce value is derived from the accumulator instead of the previous task value
- **chainingSourceAttr**: If chainingSource is set to ACCUMULATOR then use this field to define which value from the accumulator, the default is 'mean'. Possible values: mean/min/max/count/value
- **fillNullValue**: The value to use for null results, defaults to zero.
- **invertResult**: Should the result value be inverted? true|false (Alerts can only be set on positive values so this allows you to invert the result and alert upon it.)
- **ingestType**: Type of ingest storage for this task. Metric is default and preferred but storing as events can be useful. Possible values:  "metric" or "event"


Example TASKS config:

```javascript
const TASKS = [{
    "id":"example",
    "name":"Example",
    "accountId":"123456",
    "selector":"value",
    "chaining":"NONE",
    "fillNullValue": 0,
    "invertResult": false,
    "ingestType": "metric",
    "query":"FROM Transaction select count(*) as value since 1 day ago"
}]
```

### Compare With queries
Queries with compare with will return the % change value returned by the query.

### Using the Accumulator
The accumulator allows you to add the output of multiple queries together. It maintains a record of the total value, count of values, min, max and mean. The main use case for the accumulator is to allow you to compare a value from one period against the average of multiple other periods. For example if you wanted to know if the current order rate is higher or lower than the average for this same time and day as the average of previous 4 weeks then you would query each of the 4 previous weeks data as seperate tasks adding each to the accumulator. You would then query today as an additional task and chain it to the output of the accumulator mean value. See [talisker-example-accumulator.js](./examples/talisker-example-accumulator.js) for an example of this setup.

## Metrics created by Talisker
The script will process each task in the TASKS array and create a metric into New Relic via the metrics API. Each metric has the form:

- **taslisker.value** - the value thats returned by your query
- **talisker.id** - the id of the task
- **talisker.name** - the name of the task
- **talisker.monitorName** - the name of the monitor (as set by you)

You could for example target the output of a task with the following NRQL: 
`from Metric select latest(talisker.value) where talisker.monitorName='your-monitor-name' and talisker.id='your-task-id`


### Event Support
Talisker also supports storing the output results as events rather than metrics. This can be chosen on a task level by setting `ingestType` to `event`. Events will appear in the event type `taliskerSample`. e.g.: `select latest(value) from taliskerSample facet talisker.name`

## Support

New Relic has open-sourced this project. This project is provided AS-IS WITHOUT WARRANTY OR DEDICATED SUPPORT. Issues and contributions should be reported to the project here on GitHub.

>We encourage you to bring your experiences and questions to the [Explorers Hub](https://discuss.newrelic.com) where our community members collaborate on solutions and new ideas.


## Contributing

We encourage your contributions to improve [Project Name]! Keep in mind when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. You only have to sign the CLA one time per project. If you have any questions, or to execute our corporate CLA, required if your contribution is on behalf of a company, please drop us an email at opensource@newrelic.com.

**A note about vulnerabilities**

As noted in our [security policy](../../security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [HackerOne](https://hackerone.com/newrelic).

## License

Talisker is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) License.

