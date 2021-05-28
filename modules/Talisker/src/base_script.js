
 
/*
* EVERYTHING ABOVE THIS LINE IS ADDED IN BY TERRAFORM BUILD
* Example of what is set by terraform is below if you wish to run stand alone uncomment this part and adjust accordingly.
*/

// const TASKS = [{
//     "id":"example",
//     "name":"Example",
//     "accountId":"123456",
//     "selector":"value",
//     "chaining":"NONE",
//     "fillNullValue": 0,
//     "invertResult": false,
//     "query":"FROM Public_APICall select uniqueCount(api) as value since 1 day ago"
// },
// ]

// const MONITOR_NAME="Monitor Name"
// const MONITOR_ID="this-monitors-id" //the monitor id
// const NAMESPACE ="talisker"     // metric details are prefixed with this, best to leave as is
// let INSERT_KEY=$secure.YOUR_SECURE_CRED_CONTAINING_INSERT_KEY
// let QUERY_KEY=$secure.YOUR_SECURE_CRED_CONTAINING_QUERY_KEY

/*
* End of example-------------
*/


// Configurations
const TALISKER_VERSION="1"
const VERBOSE_LOG=true          // Control how much logging there is
const DEFAULT_TIMEOUT = 5000    // You can specify a timeout for each task


let assert = require('assert');
let _ = require("lodash");
let RUNNING_LOCALLY = false



/*
*  ========== LOCAL TESTING CONFIGURATION ===========================
*  This section allows you to run the script from your local machine
*  mimicking it running in the new relic environment. Much easier to develop!
*/

const IS_LOCAL_ENV = typeof $http === 'undefined';
if (IS_LOCAL_ENV) {  
  RUNNING_LOCALLY=true
  var $http = require("request");       //only for local development testing
  var $secure = {}                      //only for local development testing
  QUERY_KEY="NRAK-xxx"  //NRAK...
  INSERT_KEY="NRII-xxx"  //NRII...

  console.log("Running in local mode",true)
} 

/*
*  ========== SOME HELPER FUNCTIONS ===========================
*/


/*
* log()
*
* A logger, that logs only if verbosity is enabled
*
* @param {string|object} data - the data to log out
* @param {bool} verbose - if true overrides global setting
*/
const log = function(data, verbose) {
    if(VERBOSE_LOG || verbose) { console.log(data) }
}

/*
* asyncForEach()
*
* A handy version of forEach that supports await.
* @param {Object[]} array     - An array of things to iterate over
* @param {function} callback  - The callback for each item
*/
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
  

/*
* genericServiceCall()
* Generic service call helper for commonly repeated tasks
*
* @param {number} responseCodes  - The response code (or array of codes) expected from the api call (e.g. 200 or [200,201])
* @param {Object} options       - The standard http request options object
* @param {function} success     - Call back function to run on successfule request
*/
const  genericServiceCall = function(responseCodes,options,success) {
    !('timeout' in options) && (options.timeout = DEFAULT_TIMEOUT) //add a timeout if not already specified 
    let possibleResponseCodes=responseCodes
    if(typeof(responseCodes) == 'number') { //convert to array if not supplied as array
      possibleResponseCodes=[responseCodes]
    }
    return new Promise((resolve, reject) => {
        $http(options, function callback(error, response, body) {
        if(error) {
            reject(`Connection error on url '${options.url}'`)
        } else {
            if(!possibleResponseCodes.includes(response.statusCode)) {
                let errmsg=`Expected [${possibleResponseCodes}] response code but got '${response.statusCode}' from url '${options.url}'`
                reject(errmsg)
            } else {
                resolve(success(body,response,error))
            }
          }
        });
    })
  }

/*
* setAttribute()
* Sets a custom attribute on the synthetic record
*
* @param {string} key               - the key name
* @param {Strin|Object} value       - the value to set
*/
const setAttribute = function(key,value) {
    if(!RUNNING_LOCALLY) { //these only make sense when running on a minion
        $util.insights.set(key,value)
    } else {
        //log(`Set attribute '${key}' to ${value}`)
    }
}


/*
* sendDataToNewRelic()
* Sends a metrics payload to New Relic
*
* @param {object} data               - the payload to send
*/
const sendDataToNewRelic = async (data) =>  {
    let request = {
        url: "https://metric-api.newrelic.com/metric/v1",
        method: 'POST',
        json: true,
        headers :{
            "Api-Key": INSERT_KEY
        },
        body: data
    }
    log("\nSending data to NR metrics API...")
    return genericServiceCall([200,202],request,(body,response,error)=>{
        if(error) {
            log(`NR Post failed : ${error} `,true)
            return false
        } else {
            return true
        }
        })
}





async function runtasks(tasks) {
    let TOTALREQUESTS=0,SUCCESSFUL_REQUESTS=0,FAILED_REQUESTS=0
    let FAILURE_DETAIL = []
    let metricsInnerPayload=[]
    let previousTaskResult=0
    await asyncForEach(tasks, async (task) => {


        const graphQLQuery=`{
            actor {
              account(id: ${task.accountId}) {
                nrql(query: "${task.query}") {
                  results
                  metadata {
                    facets
                  }
                }
              }
            }
          }
          `
        const options =  {
                url: `https://api.newrelic.com/graphql`,
                method: 'POST',
                headers :{
                  "Content-Type": "application/json",
                  "API-Key": QUERY_KEY
                },
                body: JSON.stringify({ "query": graphQLQuery})
            }
    
        TOTALREQUESTS++
        log(`\n[Task ${task.id}]---------------`)
        await genericServiceCall([200],options,(body)=>{return body})
        .then((body)=>{
            try {
                bodyJSON = JSON.parse(body)

       
                let resultData={}
                let result=null
                let facetResult = false
                //deal with compare with queries
                if(bodyJSON.data.actor.account.nrql.results.length==2 && bodyJSON.data.actor.account.nrql.results[0].comparison && bodyJSON.data.actor.account.nrql.results[0].comparison) {
                    let previous=_.get(bodyJSON.data.actor.account.nrql.results.find((item)=>{return item.comparison==="previous"}),task.selector)
                    let current=_.get(bodyJSON.data.actor.account.nrql.results.find((item)=>{return item.comparison==="current"}),task.selector)
                    result=((current-previous)/current) * 100
                } else if(bodyJSON.data.actor.account.nrql.metadata &&
                        bodyJSON.data.actor.account.nrql.metadata.facets && 
                        bodyJSON.data.actor.account.nrql.metadata.facets.length > 0) {
                        //faceted data
                        facetResult=true
                        result=bodyJSON.data.actor.account.nrql.results.map((result)=>{

                            let facetArr={}

                            bodyJSON.data.actor.account.nrql.metadata.facets.forEach((facet,idx)=>{

                                if(bodyJSON.data.actor.account.nrql.metadata.facets.length > 1) {
                                    if(result.facet[idx]!==null) {
                                        facetArr[`${NAMESPACE}.facet.${facet}`]=result.facet[idx]
                                    } 
                                } else {
                                    //single facets have a different shape to multi facets!
                                    if(result.facet!==null) {
                                        facetArr[`${NAMESPACE}.facet.${facet}`]=result.facet
                                    } 
                                }

                            })
                           
                            let resultValue=_.get(result,task.selector)
                            if (resultValue==undefined) {
                                console.log(`Error: Selector '${task.selector}' was not found in ${JSON.stringify(result)}`)
                            }
                            return {
                                value: resultValue,
                                facets: facetArr
                            }
                        })
                        
                        
                } else {
                     //simple single result data
                    resultData=bodyJSON.data.actor.account.nrql.results[0]
                    result=_.get(resultData, task.selector)
                }

                const transformData = (data) => {
                    let transformedResult=data
                    //deal with null values (zero default unless specified)
                    if(data===null) {
                        transformedResult = task.fillNullValue!==undefined ? task.fillNullValue : 0
                    }

                    //Invert the result, alert conditions can only use positive thresholds :(
                    if(data!==undefined && task.invertResult===true) {
                        transformedResult=0-data
                    } 
                    return transformedResult
                }

                
                if(Array.isArray(result)){
                    result=result.map((x)=>{x.value=transformData(x.value); return x;})
                } else {
                result=transformData(result)
                //Check for chaining adjustments (not valid for faceted data)
                if(result!==undefined && task.chaining && task.chaining!="NONE") {
                    log(`Chaining mode [${task.chaining}]: current result: ${result}, previous task result: ${previousTaskResult}`)
                    switch (task.chaining) {
                        case "PERC_DIFF":
                            const percDiff = ((result - previousTaskResult)/result) *100
                            result=percDiff
                            break;
                        case "DIFF":
                            result = result - previousTaskResult
                            break;
                    }
                }
            }

  
                if(result!==undefined) {
                    SUCCESSFUL_REQUESTS++
                    log(`Task succeeded with result: ${Array.isArray(result) ? `(faceted results: ${result.length})`: result}`)
                    previousTaskResult = result //support for chaining

                    const constructMetricPayload = (value,facets) =>{
                        let metricPayload={
                            name: `${NAMESPACE}.value`,
                            type: "gauge",
                            value: value,
                            timestamp: Math.round(Date.now()/1000),
                            attributes: {}
                        }
                        metricPayload.attributes[`${NAMESPACE}.id`]=task.id
                        metricPayload.attributes[`${NAMESPACE}.name`]=task.name
                        metricPayload.attributes[`${NAMESPACE}.inverted`]=(task.invertResult===true)? true : false

                        if(facets) {
                            metricPayload.attributes[`${NAMESPACE}.faceted`] = true
                            metricPayload.attributes=Object.assign(metricPayload.attributes, facets)
                        }                        
                        metricsInnerPayload.push(metricPayload) 
                    }

                    if(Array.isArray(result)){
                        result.forEach((res)=>{
                            if(res.value!==undefined) {
                                constructMetricPayload(res.value,res.facets)
                            } 
                        })
                    }
                    else {
                        constructMetricPayload(result)
                    }

                     
                } else {
                    FAILED_REQUESTS++
                    log(`Task '${task.name}' failed, no field returned by selector '${task.selector}' in json:  ${JSON.stringify(resultData)}`)
                }

            } catch(e){
                FAILED_REQUESTS++
                log(`Task '${task.name}' failed JSON parse error: ${e} `,true)
                FAILURE_DETAIL.push(`'${task.name}' failed JSON parse: ${e} `)
            }
          
        })
        .catch((e)=>{
            FAILED_REQUESTS++
            log(`Task '${task.name}' failed with error: ${e} `,true)
            FAILURE_DETAIL.push(`'${task.name}' failed with error: ${e} `)
        })
    })


    //Prepare metric payloads for New Relic ingest

    let commonMetricBlock={"attributes": {}}
    commonMetricBlock.attributes[`${NAMESPACE}.monitorName`]=MONITOR_NAME
    commonMetricBlock.attributes[`${NAMESPACE}.monitorId`]=MONITOR_ID
    commonMetricBlock.attributes[`talisker.version`]=TALISKER_VERSION

    let metricsPayLoad=[{ 
        "common" : commonMetricBlock,
        "metrics": metricsInnerPayload
    }]

    let NRPostStatus = await sendDataToNewRelic(metricsPayLoad)
    if( NRPostStatus === true ){
        setAttribute("nrPostStatus","success")
        log("NR Post successful")   
    } else {
        FAILED_REQUESTS++
        setAttribute("nrPostStatus","failed")
        log("NR Post failed")   
    }


    log(`\n\n-----\nAttempted: ${TOTALREQUESTS}, Succeded ${SUCCESSFUL_REQUESTS}, Failed: ${FAILED_REQUESTS}`,true)
    
    //record the statistics about the success rates as custom attributes on the SyntheticCheck event type
    setAttribute("tasksAttempted",TOTALREQUESTS)
    setAttribute("tasksSucceeded",SUCCESSFUL_REQUESTS)
    setAttribute("tasksFailed",FAILED_REQUESTS)
    setAttribute("tasksSuccessRate",((SUCCESSFUL_REQUESTS/TOTALREQUESTS)*100).toFixed(2))
    setAttribute("failureDetail",FAILURE_DETAIL.join("; "))
    return FAILED_REQUESTS
}


/*
*  ========== RUN THE tasks ===========================
*/



try {
    setAttribute("totalTasksConfigured",TASKS.length)
    runtasks(TASKS).then((failed)=>{
        setAttribute("testRunComplete","YES") //to ensure we've not timed out or broken somehow
        if(failed > 0 ) {
            setAttribute("taskResult","FAILED")
            assert.fail('Not all tasks passed or ingest post failed') //assert a failure so that NR sees it as a failed test
        } else {
            setAttribute("taskResult","SUCCESS")
            assert.ok("All tasks passed")   
        }
    })

} catch(e) {
    console.log("Unexpected errors: ",e)
}
  