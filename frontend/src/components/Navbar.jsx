import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30">
      <div className="container-narrow py-4">
        <div className="glass-card flex items-center gap-4 py-3 px-4">
          <Link to="/" className="font-semibold tracking-tight">Mental Health Assistant</Link>
          <div className="flex-1" />
          <nav className="flex items-center gap-2 text-sm">
            <Link className="btn-outline" to="/dashboard">Dashboard</Link>
            <Link className="btn-outline" to="/mood">Mood</Link>
            <Link className="btn-outline" to="/chatbot">Chatbot</Link>
            {token ? (
              <button className="btn" onClick={logout}>Logout</button>
            ) : (
              <>
                <Link className="btn-outline" to="/login">Login</Link>
                <Link className="btn" to="/signup">Signup</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}


