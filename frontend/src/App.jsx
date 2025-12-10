import { useState, useEffect } from 'react'
import FailedJobsList from './components/FailedJobsList'
import './App.css'

function App() {
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem('adminToken') || ''
  )
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken)
      setIsConfigured(true)
    } else {
      setIsConfigured(false)
    }
  }, [adminToken])

  const handleLogout = () => {
    setAdminToken('')
    localStorage.removeItem('adminToken')
  }

  if (!isConfigured) {
    return (
      <div className="app">
        <div className="login-container">
          <h1>Piercing QR Admin</h1>
          <p className="subtitle">Failed Jobs Manager</p>
          <div className="login-form">
            <label htmlFor="token">Admin Token</label>
            <input
              id="token"
              type="password"
              placeholder="Enter admin token from .env file"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && adminToken) {
                  setIsConfigured(true)
                }
              }}
            />
            <button
              onClick={() => setIsConfigured(true)}
              disabled={!adminToken}
            >
              Continue
            </button>
            <p className="info-text">
              Enter the ADMIN_TOKEN from your .env file to access the admin dashboard.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Piercing QR Admin Dashboard</h1>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="app-main">
        <FailedJobsList adminToken={adminToken} />
      </main>
    </div>
  )
}

export default App
