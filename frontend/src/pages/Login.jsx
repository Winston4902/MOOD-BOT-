import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { Card } from '../components/ui.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2 tracking-tight">Welcome back</h1>
      <p className="text-sm text-gray-600 mb-4">Sign in to continue</p>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn w-full" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
      </form>
      <p className="text-sm mt-3">No account? <Link className="text-primary-700" to="/signup">Sign up</Link></p>
    </Card>
  )
}


