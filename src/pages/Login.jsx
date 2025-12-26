import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      login(response.token, response.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-mosh-dark to-mosh-black flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-mosh-accent rounded-full flex items-center justify-center">
          <span className="text-2xl">🤘</span>
        </div>
        <span className="text-3xl font-bold text-mosh-light">Moshcast</span>
      </div>

      <div className="w-full max-w-md bg-mosh-darker rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-8">Log in to Moshcast</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-mosh-text mb-2">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-3 bg-mosh-card border border-mosh-border rounded-md text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mosh-text mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-3 bg-mosh-card border border-mosh-border rounded-md text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-bold rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-mosh-border text-center">
          <p className="text-mosh-text">
            Don't have an account?{' '}
            <Link to="/signup" className="text-mosh-light hover:text-mosh-accent underline">
              Sign up for Moshcast
            </Link>
          </p>
        </div>
      </div>

      <p className="mt-8 text-mosh-muted text-sm">
        Your music. Your library. Anywhere.
      </p>
    </div>
  )
}
