variable "monitorName" {}
variable "nameSpace" { default = "talisker"}
variable "userAPIKey" {}
variable "insertAPIKey" {}
variable "frequency" {}
variable "tasks" {
    type = list(object({
        id = string
        name = string
        accountId = string
        query = string
        selector = string
        chaining = string
        fillNullValue = number
        invertResult = bool

        alert_operator = string
        alert_critical_threshold = number
        alert_warning_threshold = number
        alert_threshold_occurrences = string
        enabled = bool
        
  }))
}


#For the watcher---
variable "accountId" {}
variable "notificationChannelId" {}



# Setup the secure credentials for querying and sendign data
resource "newrelic_synthetics_secure_credential" "query" {
  key = "TALISKER_QUERY_KEY_${replace(newrelic_synthetics_monitor.monitor.id,"-","_")}"
  value = var.userAPIKey
  description = "API key for querying New Relic data"
}

resource "newrelic_synthetics_secure_credential" "insert" {
  key = "TALISKER_INSERT_KEY_${replace(newrelic_synthetics_monitor.monitor.id,"-","_")}"
  value = var.insertAPIKey
  description = "API key for inserting metrics data to New Relic"
}


resource "newrelic_synthetics_monitor" "monitor" {
  name = var.monitorName
  type = "SCRIPT_API"
  frequency = var.frequency
  status = "ENABLED"
  locations = ["AWS_US_EAST_1"]
}


data "local_file" "base_js" {
    filename = "${path.module}/src/base_script.js"
}
data "template_file" "header_js" {
    template = templatefile(
               "${path.module}/src/script_header.tmpl",
               {
                 tasks = <<TASKBLOCK
[%{ for task in var.tasks ~}
{
    "id":${jsonencode(task.id)},
    "name":${jsonencode(task.name)},
    "accountId":${jsonencode(task.accountId)},
    "selector":${jsonencode(task.selector)},
    "chaining":${jsonencode(task.chaining)},
    "nullValue":${jsonencode(task.fillNullValue)},
    "invertResult":${jsonencode(task.invertResult)},
    "query":${jsonencode(task.query)}
},
%{ endfor ~}]
TASKBLOCK
                monitorName = var.monitorName
                monitorId = newrelic_synthetics_monitor.monitor.id
                nameSpace = var.nameSpace
                insertKeyName = "TALISKER_INSERT_KEY_${upper(replace(newrelic_synthetics_monitor.monitor.id,"-","_"))}"
                queryKeyName = "TALISKER_QUERY_KEY_${upper(replace(newrelic_synthetics_monitor.monitor.id,"-","_"))}"
                keySuffix = replace(newrelic_synthetics_monitor.monitor.id,"-","_")
               }
        )
}

resource "newrelic_synthetics_monitor_script" "main" {
  monitor_id = newrelic_synthetics_monitor.monitor.id
  text = "${data.template_file.header_js.rendered} ${data.local_file.base_js.content}"

  depends_on = [newrelic_synthetics_secure_credential.query,newrelic_synthetics_secure_credential.insert]
}



