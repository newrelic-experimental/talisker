#---- Auto Alerts
resource "newrelic_alert_policy" "task_alerts" {
  name = "Talisker Task Alerts: ${var.monitorName}"
  incident_preference = "PER_CONDITION" 
}

resource "newrelic_nrql_alert_condition" "condition" {
  count                        = length(var.tasks)
  enabled                      = var.tasks[count.index].enabled             
  account_id                   = var.accountId
  policy_id                    = newrelic_alert_policy.task_alerts.id
  type                         = "static"
  name                         = var.tasks[count.index].name
  description                  = "Alert when monitor fails"
  violation_time_limit_seconds = 3600

  fill_option          = "static"
  fill_value           = 0

  aggregation_window             = 60
  expiration_duration            = 3600
  open_violation_on_expiration   = true
  close_violations_on_expiration = true

  aggregation_method = "event_timer"
  aggregation_timer = 60

  nrql {
    query             = var.tasks[count.index].ingestType == "event" ? "from ${var.nameSpace}Sample select latest(value) where talisker.monitorName ='${newrelic_synthetics_script_monitor.monitor.id}' and talisker.id='${var.tasks[count.index].id}'" : "from Metric select latest(${var.nameSpace}.value) where talisker.monitorName ='${newrelic_synthetics_script_monitor.monitor.name}' and talisker.id='${var.tasks[count.index].id}'"
  }

    critical {
        operator              = var.tasks[count.index].alert_operator
        threshold             = var.tasks[count.index].alert_critical_threshold
        threshold_duration    = 60 * var.frequency * 3  #look for violations within 3x check frequency
        threshold_occurrences = "at_least_once"
    }
    warning {
        operator              = var.tasks[count.index].alert_operator
        threshold             = var.tasks[count.index].alert_warning_threshold
        threshold_duration    = 60 * var.frequency * 3  #look for violations within 3x check frequency
        threshold_occurrences = "at_least_once"
    }

}


resource "newrelic_alert_policy_channel" "task_alert_subs" {
  policy_id  = newrelic_alert_policy.task_alerts.id
  channel_ids = [
    var.notificationChannelId
  ]
}
