import { Heart, Play, Music } from 'lucide-react'
import { useFavorites } from '../context/FavoritesContext'
import { usePlayer } from '../context/PlayerContext'
import SongRow from '../components/SongRow'

export default function Favorites() {
  const { favorites } = useFavorites()
  const { playSong } = usePlayer()

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      playSong(favorites[0], favorites, 0)
    }
  }

  return (
    <div className="p-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
          <Heart className="w-10 h-10 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-mosh-light">Favorites</h1>
          <p className="text-mosh-muted mt-1">
            {favorites.length} song{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Play All Button */}
      {favorites.length > 0 && (
        <div className="mb-6">
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-2 px-6 py-3 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-semibold rounded-full transition"
          >
            <Play className="w-5 h-5 fill-current" />
            Play All
          </button>
        </div>
      )}

      {/* Songs List */}
      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-mosh-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-mosh-light mb-2">No favorites yet</h2>
          <p className="text-mosh-muted">
            Click the heart icon on any song to add it to your favorites
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header Row */}
          <div className="flex items-center px-4 py-2 text-xs text-mosh-muted uppercase tracking-wide border-b border-mosh-border">
            <div className="w-8">#</div>
            <div className="w-10 ml-3"></div>
            <div className="ml-3 flex-1">Title</div>
            <div className="hidden md:block w-1/4 px-4">Album</div>
            <div className="w-16 text-right">Duration</div>
            <div className="w-20"></div>
          </div>

          {/* Song Rows */}
          {favorites.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index}
              queue={favorites}
              showIndex={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
