resource "newrelic_one_dashboard" "dashboard" {
  name = "Talisker: ${var.monitorName}"

  page {
    name = "Talisker: ${var.monitorName}"

    widget_billboard {
      title = "Latest run"
      row = 1
      column = 1
      width = 2
      
      critical = 0.8
      warning=  0.9
      
      nrql_query {
        query       = "SELECT latest(custom.tasksSucceeded) as 'Tasks succeeded' from SyntheticCheck  since 2 hours ago where monitorName='${newrelic_synthetics_script_monitor.monitor.name}'"
      }
    }
    widget_billboard {
      title = "Latest run"
      row = 1
      column = 3
      width = 2
      
      critical = 0.1
      warning =  0.1
      
      nrql_query {
        query       = "SELECT latest(custom.tasksFailed) as 'Tasks failed' from SyntheticCheck  since 2 hours ago where monitorName='${newrelic_synthetics_script_monitor.monitor.name}'"
      }
    }


    widget_billboard {
      title = "Latest run"
      row = 1
      column = 5
      width = 3

      nrql_query {
        query       = "SELECT latest(result) from SyntheticCheck where monitorName='${newrelic_synthetics_script_monitor.monitor.name}'"
      }
    }


     widget_line  {
      title = "Task success rate"
      row = 1
      column = 8
      width=  5
      nrql_query {
        query       = "SELECT latest(custom.tasksSuccessRate) as 'Successful runs' from SyntheticCheck timeseries  since 2 hours ago where monitorName='${newrelic_synthetics_script_monitor.monitor.name}'"
      }
    }


    #Row 2
    widget_table  {
      title = "Latest METRIC values"
      row = 2
      height = 4
      column = 1
      width = 6
      nrql_query {
        query       = "from Metric select latest(${var.nameSpace}.value) where talisker.monitorName ='${newrelic_synthetics_script_monitor.monitor.name}' facet talisker.name "
      }
    }

    widget_table  {
      title = "Recent Failures details"
      row = 2
      column = 7
      width = 6
      height = 4
      nrql_query {
        query       = "SELECT custom.failureDetail as 'Failure detail' from SyntheticCheck  since 2 hours ago where result='FAILED' and monitorName='${newrelic_synthetics_script_monitor.monitor.name}'"
      }
    }

    # Row 3
    widget_table  {
      title = "Latest EVENT values"
      row = 2
      height = 4
      column = 1
      width = 6
      nrql_query {
        query       = "from ${var.nameSpace}Sample select latest(value) where talisker.monitorName ='${newrelic_synthetics_script_monitor.monitor.name}' facet talisker.name "
      }
    }
    widget_table  {
      title = "Integration errors"
      row = 3
      column = 7
      width = 6
      height = 4
      nrql_query {
        query       = "SELECT * from NrIntegrationError where metricNameSample like '${var.nameSpace}.%' since 1 days ago"
      }
    }


  }


  
}