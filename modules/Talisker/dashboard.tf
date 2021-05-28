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
        query       = "SELECT latest(custom.tasksSucceeded) as 'Tasks succeeded' from SyntheticCheck  since 2 hours ago where monitorId='${newrelic_synthetics_monitor.monitor.id}'"
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
        query       = "SELECT latest(custom.tasksFailed) as 'Tasks failed' from SyntheticCheck  since 2 hours ago where monitorId='${newrelic_synthetics_monitor.monitor.id}'"
      }
    }


    widget_billboard {
      title = "Latest run"
      row = 1
      column = 5
      width = 3

      nrql_query {
        query       = "SELECT latest(result) from SyntheticCheck where monitorId='${newrelic_synthetics_monitor.monitor.id}'"
      }
    }


     widget_line  {
      title = "Task success rate"
      row = 1
      column = 8
      width=  5
      nrql_query {
        query       = "SELECT latest(custom.tasksSuccessRate) as 'Successful runs' from SyntheticCheck timeseries  since 2 hours ago where monitorId='${newrelic_synthetics_monitor.monitor.id}'"
      }
    }


    #Row 2
    widget_table  {
      title = "Latest values"
      row = 2
      height = 6
      column = 1
      width = 6
      nrql_query {
        query       = "from Metric select latest(${var.nameSpace}.value) where talisker.monitorId ='${newrelic_synthetics_monitor.monitor.id}' facet talisker.name "
      }
    }

    widget_table  {
      title = "Recent Failures details"
      row = 2
      column = 7
      width = 6
      nrql_query {
        query       = "SELECT custom.failureDetail as 'Failure detail' from SyntheticCheck  since 2 hours ago where result='FAILED' and monitorId='${newrelic_synthetics_monitor.monitor.id}'"
      }
    }

    # Row 3
    widget_table  {
      title = "Integration errors"
      row = 3
      column = 7
      width = 6
      nrql_query {
        query       = "SELECT * from NrIntegrationError where metricNameSample like '${var.nameSpace}.%' since 1 days ago"
      }
    }


  }


  
}