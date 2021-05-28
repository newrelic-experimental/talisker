# Monitor the monitor!


# ALERT ----------------------------------------------------------------------------------------------------------
resource "newrelic_alert_policy" "watcher" {
  name = "Talisker watcher: ${var.monitorName}"
  incident_preference = "PER_POLICY" # PER_POLICY is default
}

resource "newrelic_nrql_alert_condition" "watcher" {
  account_id                   = var.accountId
  policy_id                    = newrelic_alert_policy.watcher.id
  type                         = "static"
  name                         = "Failed runs detector"
  description                  = "Alert when monitor fails"
  enabled                      = true
  violation_time_limit_seconds = 3600
  value_function               = "single_value"

  fill_option          = "static"
  fill_value           = 0

  aggregation_window             = 60
  expiration_duration            = 3600
  open_violation_on_expiration   = true
  close_violations_on_expiration = true

  nrql {
    query             = "select latest(custom.tasksSuccessRate) from SyntheticCheck where  monitorId = '${newrelic_synthetics_monitor.monitor.id}'"
    evaluation_offset = 3
  }

  critical {
    operator              = "below"
    threshold             = 100
    threshold_duration    = 60 * var.frequency * 3  #look for violations within 3x check frequency
    threshold_occurrences = "ALL"
  }

}

resource "newrelic_alert_policy_channel" "channel_subs" {
  policy_id  = newrelic_alert_policy.watcher.id
  channel_ids = [
    var.notificationChannelId
  ]
}

