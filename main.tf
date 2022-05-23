module "example1" {
  source = "./modules/Talisker"
  monitorName = "Talisker NRDB Alerts"
  frequency = 15
  userAPIKey = var.userAPIKey
  insertAPIKey = var.insertAPIKey
  accountId = var.terraformNRAccountId
  notificationChannelId = newrelic_alert_channel.SlackDemo.id
  dataCenter = "US"

  tasks = [
    {
      id = "example1"
      name = "EX1: Simple value"
      accountId = var.terraformNRAccountId
      query = "FROM Public_APICall select count(*)/100000 as value since 1 day ago"
      selector = "value"
      fillNullValue = 0
      chaining="NONE"
      invertResult = false
      ingestType = "metric"

      alert_operator = "below"
      alert_critical_threshold = 2500
      alert_warning_threshold = 3000
      alert_threshold_occurrences = "all"   
      enabled = true 
    },
    {
      id = "example2"
      name = "EX2: Compare with"
      accountId = var.terraformNRAccountId
      query = "FROM Public_APICall select count(*) as value since 1 day ago compare with 1 week ago"
      selector = "value"
      fillNullValue = 0
      chaining="NONE"
      invertResult = false
      ingestType = "metric"

      alert_operator = "below"
      alert_critical_threshold = 0
      alert_warning_threshold = 10
      alert_threshold_occurrences = "all"   
      enabled = true 
    },
    {
      id = "example3"
      name = "EX3: Chaining setup"
      accountId = var.terraformNRAccountId
      query = "FROM Public_APICall select count(*) as value since 8 day ago until 7 day ago"
      selector = "value"
      fillNullValue = 0
      chaining="NONE"
      invertResult = false
      ingestType = "metric"

      alert_operator = "below"
      alert_critical_threshold = 0
      alert_warning_threshold = 0
      alert_threshold_occurrences = "all" 
      enabled = false  
    },
    {
      id = "example4"
      name = "EX4: Chained value"
      accountId = var.terraformNRAccountId
      query = "FROM Public_APICall select count(*) as value since 1 day ago"
      selector = "value"
      fillNullValue = 0
      chaining="PERC_DIFF"
      invertResult = true
      ingestType = "metric"

      alert_operator = "above"
      alert_critical_threshold = 40
      alert_warning_threshold = 30
      alert_threshold_occurrences = "all"
      enabled = true    
    },
    {
      id = "example5"
      name = "EX5: Event storage example"
      accountId = var.terraformNRAccountId
      query = "FROM Public_APICall select count(*)/100000 as value since 1 day ago"
      selector = "value"
      fillNullValue = 0
      chaining="NONE"
      invertResult = false
      ingestType = "event"

      alert_operator = "below"
      alert_critical_threshold = 2500
      alert_warning_threshold = 3000
      alert_threshold_occurrences = "all"   
      enabled = true 
    },
  ]
}
