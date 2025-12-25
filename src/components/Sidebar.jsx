import { NavLink } from 'react-router-dom'
import { Home, Search, Library, PlusSquare, Music } from 'lucide-react'

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-4 px-4 py-2 rounded-md transition ${
      isActive 
        ? 'bg-mosh-card text-mosh-light' 
        : 'text-mosh-text hover:text-mosh-light'
    }`

  return (
    <aside className="w-64 bg-mosh-black flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-mosh-accent rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-mosh-black" />
          </div>
          <span className="text-xl font-bold text-mosh-light">Moshcast</span>
        </div>
        <p className="text-xs text-mosh-muted mt-2 ml-10">Your music. Your library. Everywhere.</p>
      </div>

      {/* Main Navigation */}
      <nav className="px-2 space-y-1">
        <NavLink to="/" className={linkClass}>
          <Home className="w-6 h-6" />
          <span className="font-medium">Home</span>
        </NavLink>
        
        <NavLink to="/search" className={linkClass}>
          <Search className="w-6 h-6" />
          <span className="font-medium">Search</span>
        </NavLink>
        
        <NavLink to="/library" className={linkClass}>
          <Library className="w-6 h-6" />
          <span className="font-medium">Your Library</span>
        </NavLink>
      </nav>

      {/* Divider */}
      <div className="my-4 mx-4 border-t border-mosh-border" />

      {/* Actions */}
      <nav className="px-2 space-y-1">
        <NavLink to="/upload" className={linkClass}>
          <PlusSquare className="w-6 h-6" />
          <span className="font-medium">Upload Music</span>
        </NavLink>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="p-4 text-xs text-mosh-muted">
        <p>© 2025 Moshcast</p>
      </div>
    </aside>
  )
}
