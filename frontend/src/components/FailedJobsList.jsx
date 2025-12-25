import { useState, useEffect } from 'react'
import './FailedJobsList.css'

const API_BASE_URL = 'http://localhost:3000'

function FailedJobsList({ adminToken }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [metrics, setMetrics] = useState(null)

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      const url = filter === 'all' 
        ? `${API_BASE_URL}/admin/failed-jobs`
        : `${API_BASE_URL}/admin/failed-jobs?status=${filter}`

      const response = await fetch(url, {
        headers: {
          'x-admin-token': adminToken,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`)
      }

      const data = await response.json()
      setJobs(data.failedJobs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/queue-metrics`, {
        headers: {
          'x-admin-token': adminToken,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchMetrics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchJobs()
      fetchMetrics()
    }, 30000)

    return () => clearInterval(interval)
  }, [filter, adminToken])

  const handleRetry = async (jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/failed-jobs/${jobId}/retry`, {
        method: 'POST',
        headers: {
          'x-admin-token': adminToken,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to retry job')
      }

      // Refresh the list
      fetchJobs()
      alert('Job scheduled for retry')
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this failed job?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/failed-jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete job')
      }

      // Refresh the list
      fetchJobs()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'failed':
        return '#e74c3c'
      case 'retrying':
        return '#f39c12'
      case 'resolved':
        return '#27ae60'
      default:
        return '#7f8c8d'
    }
  }

  return (
    <div className="failed-jobs-container">
      <div className="jobs-header">
        <h2>Failed Jobs</h2>
        <button className="refresh-btn" onClick={fetchJobs}>
          Refresh
        </button>
      </div>

      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Waiting</h3>
            <p className="metric-value">{metrics.waiting}</p>
          </div>
          <div className="metric-card">
            <h3>Active</h3>
            <p className="metric-value">{metrics.active}</p>
          </div>
          <div className="metric-card">
            <h3>Completed</h3>
            <p className="metric-value">{metrics.completed}</p>
          </div>
          <div className="metric-card">
            <h3>Failed</h3>
            <p className="metric-value">{metrics.failed}</p>
          </div>
          <div className="metric-card">
            <h3>Delayed</h3>
            <p className="metric-value">{metrics.delayed}</p>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'failed' ? 'active' : ''}
          onClick={() => setFilter('failed')}
        >
          Failed
        </button>
        <button
          className={filter === 'retrying' ? 'active' : ''}
          onClick={() => setFilter('retrying')}
        >
          Retrying
        </button>
        <button
          className={filter === 'resolved' ? 'active' : ''}
          onClick={() => setFilter('resolved')}
        >
          Resolved
        </button>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <p className="error-hint">
            Make sure the backend server is running on port 3000 and the admin token is correct.
          </p>
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="empty-state">
          <p>No failed jobs found.</p>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="jobs-list">
          {jobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <div>
                  <span className="job-type">{job.jobType}</span>
                  <span
                    className="job-status"
                    style={{ backgroundColor: getStatusColor(job.status) }}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="job-actions">
                  {job.status !== 'resolved' && (
                    <button
                      className="retry-btn"
                      onClick={() => handleRetry(job.id)}
                    >
                      Retry
                    </button>
                  )}
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(job.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="job-details">
                <div className="detail-row">
                  <strong>Failed At:</strong> {formatDate(job.failedAt)}
                </div>
                {job.retriedAt && (
                  <div className="detail-row">
                    <strong>Retried At:</strong> {formatDate(job.retriedAt)}
                  </div>
                )}
                <div className="detail-row">
                  <strong>Attempts:</strong> {job.attempts}
                </div>
                <div className="detail-row">
                  <strong>Error:</strong>
                  <div className="error-text">{job.error}</div>
                </div>
                <details className="job-data-details">
                  <summary>Job Data</summary>
                  <pre>{JSON.stringify(JSON.parse(job.jobData), null, 2)}</pre>
                </details>
                {job.stackTrace && (
                  <details className="stack-trace-details">
                    <summary>Stack Trace</summary>
                    <pre>{job.stackTrace}</pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FailedJobsList
