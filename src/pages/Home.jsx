import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { library as libraryAPI } from '../utils/api'
import SongRow from '../components/SongRow'
import { Clock, Music, Loader2 } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()
  const [recentSongs, setRecentSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadRecentSongs()
  }, [])

  const loadRecentSongs = async () => {
    try {
      const data = await libraryAPI.getRecent(10)
      setRecentSongs(data.songs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-mosh-light">
          {getGreeting()}{user?.username ? `, ${user.username}` : ''}
        </h1>
      </div>

      {/* Recently Added Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-mosh-accent" />
          <h2 className="text-xl font-bold text-mosh-light">Recently Added</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-mosh-accent animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-400 py-8 text-center">
            {error}
          </div>
        ) : recentSongs.length === 0 ? (
          <div className="bg-mosh-card rounded-lg p-8 text-center">
            <Music className="w-12 h-12 text-mosh-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-mosh-light mb-2">
              Your library is empty
            </h3>
            <p className="text-mosh-text mb-4">
              Upload some music to get started
            </p>
            <a 
              href="/upload"
              className="inline-block px-6 py-2 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-medium rounded-full transition"
            >
              Upload Music
            </a>
          </div>
        ) : (
          <div className="bg-mosh-dark rounded-lg">
            {/* Header Row */}
            <div className="flex items-center px-4 py-3 border-b border-mosh-border text-sm text-mosh-muted">
              <div className="w-8 text-center">#</div>
              <div className="w-10 ml-3" />
              <div className="ml-3 flex-1">Title</div>
              <div className="hidden md:block w-1/4 px-4">Album</div>
              <div className="w-16 text-right">
                <Clock className="w-4 h-4 inline" />
              </div>
              <div className="w-9" />
            </div>

            {/* Song Rows */}
            {recentSongs.map((song, index) => (
              <SongRow 
                key={song.id} 
                song={song} 
                index={index}
                queue={recentSongs}
              />
            ))}
          </div>
        )}
      </section>

      {/* Quick Stats */}
      {user && (
        <section>
          <h2 className="text-xl font-bold text-mosh-light mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-mosh-card rounded-lg p-4">
              <p className="text-2xl font-bold text-mosh-accent">
                {user.song_count || 0}
              </p>
              <p className="text-sm text-mosh-text">Songs</p>
            </div>
            <div className="bg-mosh-card rounded-lg p-4">
              <p className="text-2xl font-bold text-mosh-accent">
                {user.playlist_count || 0}
              </p>
              <p className="text-sm text-mosh-text">Playlists</p>
            </div>
            <div className="bg-mosh-card rounded-lg p-4">
              <p className="text-2xl font-bold text-mosh-accent">
                {user.storage_used_gb || '0'} GB
              </p>
              <p className="text-sm text-mosh-text">Used</p>
            </div>
            <div className="bg-mosh-card rounded-lg p-4">
              <p className="text-2xl font-bold text-mosh-accent">
                {user.storage_limit_gb || '15'} GB
              </p>
              <p className="text-sm text-mosh-text">Limit</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
