import { NavLink } from 'react-router-dom'
import { Home, Library, Upload, Search, Radio, ListMusic, Heart } from 'lucide-react'

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
      isActive 
        ? 'bg-mosh-hover text-mosh-light' 
        : 'text-mosh-text hover:text-mosh-light hover:bg-mosh-hover'
    }`

  return (
    <div className="w-64 bg-mosh-dark flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-mosh-light">Moshcast</h1>
          <span className="text-sm font-semibold text-mosh-accent -rotate-12">BETA</span>
        </div>
        <p className="text-xs text-mosh-muted mt-1">Your music. Your library. Everywhere.</p>
      </div>

      {/* Go Live - Primary CTA */}
      <div className="px-4 mb-4">
        <NavLink
          to="/live"
          className={({ isActive }) =>
            `flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition ${
              isActive
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                : 'bg-gradient-to-r from-red-500/80 to-pink-500/80 hover:from-red-500 hover:to-pink-500 text-white'
            }`
          }
        >
          <Radio className="w-5 h-5" />
          <span>Go Live</span>
        </NavLink>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-4 border-t border-mosh-border" />

      {/* Main Nav */}
      <nav className="flex-1 px-4">
        <div className="space-y-1">
          <NavLink to="/" className={linkClass} end>
            <Home className="w-5 h-5" />
            <span>Home</span>
          </NavLink>
          
          <NavLink to="/search" className={linkClass}>
            <Search className="w-5 h-5" />
            <span>Search</span>
          </NavLink>
          
          <NavLink to="/library" className={linkClass}>
            <Library className="w-5 h-5" />
            <span>Your Library</span>
          </NavLink>

          <NavLink to="/favorites" className={linkClass}>
            <Heart className="w-5 h-5" />
            <span>Favorites</span>
          </NavLink>

          <NavLink to="/playlists" className={linkClass}>
            <ListMusic className="w-5 h-5" />
            <span>Playlists</span>
          </NavLink>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-mosh-border" />

        {/* Actions */}
        <div className="space-y-1">
          <NavLink to="/upload" className={linkClass}>
            <Upload className="w-5 h-5" />
            <span>Upload Music</span>
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-mosh-border">
        <p className="text-xs text-mosh-muted text-center">
          © 2025 Moshcast™ | A Coinloader Company
        </p>
        <a 
          href="mailto:support@moshcast.com" 
          className="block text-xs text-mosh-muted hover:text-mosh-accent text-center mt-1 transition"
        >
          Contact Us
        </a>
      </div>
    </div>
  )
}
