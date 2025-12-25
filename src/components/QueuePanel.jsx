import { X, Music, Play } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { formatDuration } from '../utils/format'

export default function QueuePanel({ queue, currentIndex, onClose }) {
  const { playSong } = usePlayer()

  return (
    <div className="fixed right-0 bottom-24 w-80 max-h-96 bg-mosh-dark border border-mosh-border rounded-tl-lg shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-mosh-border">
        <h3 className="font-bold text-mosh-light">Now Playing</h3>
        <button 
          onClick={onClose}
          className="p-1 text-mosh-muted hover:text-mosh-light transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="p-4 text-center text-mosh-muted">
            Queue is empty
          </div>
        ) : (
          queue.map((song, index) => (
            <div
              key={`${song.id}-${index}`}
              onClick={() => playSong(song, queue, index)}
              className={`flex items-center gap-3 p-3 hover:bg-mosh-hover cursor-pointer transition ${
                index === currentIndex ? 'bg-mosh-hover' : ''
              }`}
            >
              {/* Index or Playing indicator */}
              <div className="w-6 text-center">
                {index === currentIndex ? (
                  <Play className="w-4 h-4 text-mosh-accent mx-auto" />
                ) : (
                  <span className="text-sm text-mosh-muted">{index + 1}</span>
                )}
              </div>

              {/* Artwork */}
              <div className="w-10 h-10 bg-mosh-card rounded flex items-center justify-center flex-shrink-0">
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

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  index === currentIndex ? 'text-mosh-accent' : 'text-mosh-light'
                }`}>
                  {song.title}
                </p>
                <p className="text-xs text-mosh-muted truncate">
                  {song.artist || 'Unknown Artist'}
                </p>
              </div>

              {/* Duration */}
              <span className="text-xs text-mosh-muted">
                {formatDuration(song.duration)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-mosh-border text-center">
        <p className="text-xs text-mosh-muted">
          {queue.length} song{queue.length !== 1 ? 's' : ''} in queue
        </p>
      </div>
    </div>
  )
}
