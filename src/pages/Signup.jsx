import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!acceptTerms) {
      setError('You must accept the Terms of Service')
      return
    }

    setLoading(true)

    try {
      await signup(email, password, username)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-mosh-card to-mosh-black flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-mosh-accent rounded-full flex items-center justify-center">
          <span className="text-2xl">🤘</span>
        </div>
        <span className="text-3xl font-bold text-mosh-light">Moshcast</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-mosh-darker rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-8">Sign up for Moshcast</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cooluser123"
              required
              minLength={3}
              maxLength={50}
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
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="w-full px-4 py-3 bg-mosh-card border border-mosh-border rounded-md text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mosh-text mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              className="w-full px-4 py-3 bg-mosh-card border border-mosh-border rounded-md text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent transition"
            />
          </div>

          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-mosh-border bg-mosh-card text-mosh-accent focus:ring-mosh-accent"
            />
            <label htmlFor="terms" className="text-sm text-mosh-text">
              I agree to the{' '}
              <Link to="/terms" className="text-mosh-light hover:text-mosh-accent underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-mosh-light hover:text-mosh-accent underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-bold rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="mt-6 text-xs text-mosh-muted text-center">
          Only upload music you own or have rights to stream.
        </p>

        <div className="mt-6 pt-6 border-t border-mosh-border text-center">
          <p className="text-mosh-text">
            Already have an account?{' '}
            <Link to="/login" className="text-mosh-light hover:text-mosh-accent underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
