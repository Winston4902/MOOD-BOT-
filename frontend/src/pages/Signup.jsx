import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { Card } from '../components/ui.jsx'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/signup', { name, email, password })
      localStorage.setItem('token', data.token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2 tracking-tight">Create account</h1>
      <p className="text-sm text-gray-600 mb-4">Join and track your wellbeing</p>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn w-full" disabled={loading}>{loading ? 'Creating...' : 'Sign up'}</button>
      </form>
      <p className="text-sm mt-3">Already have an account? <Link className="text-primary-700" to="/login">Log in</Link></p>
    </Card>
  )
}


