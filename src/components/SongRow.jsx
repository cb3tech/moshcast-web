import { Play, Pause, MoreHorizontal, Music } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { formatDuration } from '../utils/format'

export default function SongRow({ song, index, queue = [], showIndex = true }) {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer()
  
  const isCurrentSong = currentSong?.id === song.id
  const isThisPlaying = isCurrentSong && isPlaying

  const handleClick = () => {
    if (isCurrentSong) {
      togglePlay()
    } else {
      playSong(song, queue, index)
    }
  }

  return (
    <div 
      className={`group flex items-center px-4 py-2 rounded-md hover:bg-mosh-hover transition cursor-pointer ${
        isCurrentSong ? 'bg-mosh-hover' : ''
      }`}
      onClick={handleClick}
    >
      {/* Index / Play Button */}
      <div className="w-8 flex justify-center">
        {showIndex && !isCurrentSong && (
          <span className="text-mosh-muted group-hover:hidden">
            {index + 1}
          </span>
        )}
        {isThisPlaying ? (
          <Pause className="w-4 h-4 text-mosh-accent" />
        ) : (
          <Play className={`w-4 h-4 ${isCurrentSong ? 'text-mosh-accent' : 'text-mosh-light'} ${showIndex && !isCurrentSong ? 'hidden group-hover:block' : ''}`} />
        )}
      </div>

      {/* Artwork */}
      <div className="w-10 h-10 bg-mosh-card rounded flex items-center justify-center ml-3 flex-shrink-0">
        {song.artwork_url ? (
          <img 
            src={song.artwork_url} 
            alt={song.album}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <Music className="w-4 h-4 text-mosh-muted" />
        )}
      </div>

      {/* Title & Artist */}
      <div className="ml-3 flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrentSong ? 'text-mosh-accent' : 'text-mosh-light'}`}>
          {song.title}
        </p>
        <p className="text-xs text-mosh-text truncate">
          {song.artist || 'Unknown Artist'}
        </p>
      </div>

      {/* Album */}
      <div className="hidden md:block w-1/4 px-4">
        <p className="text-sm text-mosh-text truncate">
          {song.album || '—'}
        </p>
      </div>

      {/* Duration */}
      <div className="w-16 text-right">
        <span className="text-sm text-mosh-muted">
          {formatDuration(song.duration)}
        </span>
      </div>

      {/* More Options */}
      <button 
        className="ml-4 p-1 opacity-0 group-hover:opacity-100 text-mosh-muted hover:text-mosh-light transition"
        onClick={(e) => {
          e.stopPropagation()
          // TODO: Open context menu
        }}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  )
}
