variable "monitorName" {}
variable "nameSpace" { default = "talisker"} #each deployment of terraform this needs to be unique value
variable "userAPIKey" {}
variable "insertAPIKey" {}
variable "period" {}
variable "frequency" {}
variable "dataCenter" { default = "US" }
variable "accountId" {}
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
        ingestType = string

        alert_operator = string
        alert_critical_threshold = number
        alert_warning_threshold = number
        alert_threshold_occurrences = string
        enabled = bool
        
  }))
}


#For the watcher---
variable "notificationChannelId" {}



# Setup the secure credentials for querying and sendign data
resource "newrelic_synthetics_secure_credential" "query" {
  key = "TALISKER_QUERY_KEY_${var.nameSpace}"
  value = var.userAPIKey
  description = "API key for querying New Relic data"
}

resource "newrelic_synthetics_secure_credential" "insert" {
  key = "TALISKER_INSERT_KEY_${var.nameSpace}"
  value = var.insertAPIKey
  description = "API key for inserting metrics data to New Relic"
}


resource "newrelic_synthetics_script_monitor" "monitor" {
  name = var.monitorName
  type = "SCRIPT_API"
  period = var.period
  status = "ENABLED"
  locations_public = ["AWS_US_EAST_1"]
  script = "${local.header_js} ${data.local_file.base_js.content}"
  script_language      = "JAVASCRIPT"
  runtime_type         = "NODE_API"
  runtime_type_version = "16.10"


  # depends_on = [newrelic_synthetics_secure_credential.query,newrelic_synthetics_secure_credential.insert]
}


data "local_file" "base_js" {
    filename = "${path.module}/src/base_script.js"
}

locals {
      header_js = templatefile(
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
    "ingestType":${jsonencode(task.ingestType)},
    "query":${jsonencode(task.query)}
},
%{ endfor ~}]
TASKBLOCK
                monitorName = var.monitorName
                nameSpace = var.nameSpace
                insertKeyName = "TALISKER_INSERT_KEY_${upper(var.nameSpace)}"
                queryKeyName = "TALISKER_QUERY_KEY_${upper(var.nameSpace)}"
                dataCenter = var.dataCenter
                accountId = var.accountId
               }
        )
}

# data "template_file" "header_js" {
#     template = templatefile(
#                "${path.module}/src/script_header.tmpl",
#                {
#                  tasks = <<TASKBLOCK
# [%{ for task in var.tasks ~}
# {
#     "id":${jsonencode(task.id)},
#     "name":${jsonencode(task.name)},
#     "accountId":${jsonencode(task.accountId)},
#     "selector":${jsonencode(task.selector)},
#     "chaining":${jsonencode(task.chaining)},
#     "nullValue":${jsonencode(task.fillNullValue)},
#     "invertResult":${jsonencode(task.invertResult)},
#     "ingestType":${jsonencode(task.ingestType)},
#     "query":${jsonencode(task.query)}
# },
# %{ endfor ~}]
# TASKBLOCK
#                 monitorName = var.monitorName
#                 monitorId = newrelic_synthetics_script_monitor.monitor.id
#                 nameSpace = var.nameSpace
#                 insertKeyName = "TALISKER_INSERT_KEY_${upper(replace(newrelic_synthetics_script_monitor.monitor.id,"-","_"))}"
#                 queryKeyName = "TALISKER_QUERY_KEY_${upper(replace(newrelic_synthetics_script_monitor.monitor.id,"-","_"))}"
#                 keySuffix = replace(newrelic_synthetics_script_monitor.monitor.id,"-","_")
#                 dataCenter = var.dataCenter
#                 accountId = var.accountId
#                }
#         )
# }



