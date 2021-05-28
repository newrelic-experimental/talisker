variable "terraformAPIKey" { description="A New Relic user licence key managing resources via terraform provider"}
variable terraformNRAccountId  { description = "New Relic Account ID for terraform resources"} 
variable "userAPIKey" { description="A New Relic user licence key for retrieving data via graphQL API"}
variable "insertAPIKey" { description="A New Relic insert key for sending data to metrics API"}

variable "slackChannelURL" { description="Slack webhook URL"}