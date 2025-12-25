import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, LogOut, Settings, HardDrive } from 'lucide-react'

export default function AccountMenu() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Calculate storage percentage
  const storagePercent = user?.storage_limit 
    ? Math.round((user.storage_used / user.storage_limit) * 100) 
    : 0

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-mosh-card hover:bg-mosh-hover rounded-full transition"
      >
        <div className="w-7 h-7 bg-mosh-accent rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-mosh-black">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <span className="text-sm font-medium text-mosh-light hidden sm:block">
          {user?.username || 'Account'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 top-12 w-64 bg-mosh-card border border-mosh-border rounded-lg shadow-xl z-50 py-2">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-mosh-border">
            <p className="font-medium text-mosh-light">{user?.username}</p>
            <p className="text-sm text-mosh-muted">{user?.email}</p>
          </div>

          {/* Storage Info */}
          <div className="px-4 py-3 border-b border-mosh-border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-mosh-text flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Storage
              </span>
              <span className="text-mosh-muted">
                {user?.storage_used_gb || '0'} / {user?.storage_limit_gb || '15'} GB
              </span>
            </div>
            <div className="h-1.5 bg-mosh-dark rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  storagePercent > 90 ? 'bg-red-500' : 
                  storagePercent > 70 ? 'bg-yellow-500' : 'bg-mosh-accent'
                }`}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Plan */}
          <div className="px-4 py-2 border-b border-mosh-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-mosh-text">Plan</span>
              <span className="text-sm font-medium text-mosh-accent capitalize">
                {user?.plan || 'Free'}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setMenuOpen(false)
                // TODO: Navigate to settings page
              }}
              className="w-full px-4 py-2 text-left text-sm text-mosh-light hover:bg-mosh-hover flex items-center gap-3 transition"
            >
              <Settings className="w-4 h-4 text-mosh-muted" />
              Settings
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-mosh-light hover:bg-mosh-hover flex items-center gap-3 transition"
            >
              <LogOut className="w-4 h-4 text-mosh-muted" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
