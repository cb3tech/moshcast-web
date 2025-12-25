import { createContext, useContext, useState, useEffect } from 'react'
import { auth as authAPI } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('moshcast_token')
    if (token) {
      authAPI.me()
        .then(userData => {
          setUser(userData)
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('moshcast_token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    setError(null)
    try {
      const data = await authAPI.login(email, password)
      localStorage.setItem('moshcast_token', data.token)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const signup = async (email, password, username) => {
    setError(null)
    try {
      const data = await authAPI.signup(email, password, username)
      localStorage.setItem('moshcast_token', data.token)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('moshcast_token')
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const userData = await authAPI.me()
      setUser(userData)
    } catch (err) {
      console.error('Failed to refresh user:', err)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      signup,
      logout,
      refreshUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
