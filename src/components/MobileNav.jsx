import { NavLink } from 'react-router-dom'
import { Home, Radio, Tv, Users, Library } from 'lucide-react'
import { useFriends } from '../context/FriendsContext'

export default function MobileNav() {
  const { pendingRequests, friendsListening } = useFriends()
  
  const notificationCount = (pendingRequests?.length || 0) + (friendsListening?.length || 0)

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/streams', icon: Tv, label: 'Live' },
    { to: '/live', icon: Radio, label: 'Go Live', accent: true },
    { to: '/friends', icon: Users, label: 'Friends', badge: notificationCount },
    { to: '/library', icon: Library, label: 'Library' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-mosh-dark border-t border-mosh-border z-50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label, accent, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                accent
                  ? 'text-red-400'
                  : isActive
                    ? 'text-mosh-accent'
                    : 'text-mosh-muted hover:text-mosh-light'
              }`
            }
          >
            <div className="relative">
              <Icon className={`w-6 h-6 ${accent ? 'text-red-400' : ''}`} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-1 ${accent ? 'text-red-400 font-medium' : ''}`}>
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
