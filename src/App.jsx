import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { FriendsProvider } from './context/FriendsContext'
import Sidebar from './components/Sidebar'
import Player from './components/Player'
import AccountMenu from './components/AccountMenu'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Library from './pages/Library'
import Upload from './pages/Upload'
import GoLive from './pages/GoLive'
import JoinStream from './pages/JoinStream'
import Playlists from './pages/Playlists'
import Favorites from './pages/Favorites'
import Friends from './pages/Friends'
import LiveStreams from './pages/LiveStreams'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Settings from './pages/Settings'
import News from './pages/News'
import { Loader2 } from 'lucide-react'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-mosh-darker flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-mosh-accent animate-spin" />
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Main layout with sidebar, header, and player
function MainLayout({ children }) {
  return (
    <FavoritesProvider>
      <FriendsProvider>
        <div className="flex h-screen bg-mosh-darker overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-mosh-darker flex items-center justify-end px-6 flex-shrink-0">
              <AccountMenu />
            </header>
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-24">
              {children}
            </main>
          </div>
          <Player />
        </div>
      </FriendsProvider>
    </FavoritesProvider>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/join/:username" element={<JoinStream />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <Home />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/library" element={
        <ProtectedRoute>
          <MainLayout>
            <Library />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/upload" element={
        <ProtectedRoute>
          <MainLayout>
            <Upload />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/live" element={
        <ProtectedRoute>
          <MainLayout>
            <GoLive />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/streams" element={
        <ProtectedRoute>
          <MainLayout>
            <LiveStreams />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/friends" element={
        <ProtectedRoute>
          <MainLayout>
            <Friends />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/playlists" element={
        <ProtectedRoute>
          <MainLayout>
            <Playlists />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/favorites" element={
        <ProtectedRoute>
          <MainLayout>
            <Favorites />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/search" element={
        <ProtectedRoute>
          <MainLayout>
            <Library />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <Settings />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/news" element={
        <ProtectedRoute>
          <MainLayout>
            <News />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
