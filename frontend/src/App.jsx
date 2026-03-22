import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MoodTracker from './pages/MoodTracker.jsx'
import Chatbot from './pages/Chatbot.jsx'
import Navbar from './components/Navbar.jsx'

function useAuth() {
  const token = localStorage.getItem('token')
  return Boolean(token)
}

function ProtectedRoute({ children }) {
  const authed = useAuth()
  const location = useLocation()
  if (!authed) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-narrow py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/mood" element={<ProtectedRoute><MoodTracker /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}


