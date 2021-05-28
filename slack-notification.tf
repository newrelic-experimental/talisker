
/*
The notifcation channel is used as an example it can be removed if not needed. 
You will need to remove from  the watcher.tf in the main module.
*/
resource "newrelic_alert_channel" "SlackDemo" {
  name = "Talisker Demo Slack"
  type = "slack"
  config {
    url = var.slackChannelURL
  }
}
