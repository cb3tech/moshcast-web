import { usePlayer } from '../context/PlayerContext'
import { formatDuration } from '../utils/format'
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Shuffle, Repeat, Repeat1,
  Music
} from 'lucide-react'

export default function Player() {
  const {
    currentSong,
    isPlaying,
    duration,
    currentTime,
    volume,
    shuffle,
    repeat,
    togglePlay,
    playNext,
    playPrev,
    seek,
    changeVolume,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer()

  // Don't render if no song
  if (!currentSong) {
    return null
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = (e) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    seek(percent * duration)
  }

  const handleVolumeChange = (e) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    changeVolume(Math.max(0, Math.min(1, percent)))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-mosh-dark border-t border-mosh-border px-4 flex items-center z-50">
      {/* Song Info - Left */}
      <div className="flex items-center w-1/4 min-w-0">
        <div className="w-14 h-14 bg-mosh-card rounded flex items-center justify-center flex-shrink-0">
          {currentSong.artwork_url ? (
            <img 
              src={currentSong.artwork_url} 
              alt={currentSong.album}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <Music className="w-6 h-6 text-mosh-muted" />
          )}
        </div>
        <div className="ml-3 min-w-0">
          <p className="text-sm font-medium text-mosh-light truncate">
            {currentSong.title}
          </p>
          <p className="text-xs text-mosh-text truncate">
            {currentSong.artist}
          </p>
        </div>
      </div>

      {/* Controls - Center */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Buttons */}
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={toggleShuffle}
            className={`p-1 hover:text-mosh-light transition ${shuffle ? 'text-mosh-accent' : 'text-mosh-muted'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          
          <button 
            onClick={playPrev}
            className="p-1 text-mosh-text hover:text-mosh-light transition"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-8 h-8 bg-mosh-light rounded-full flex items-center justify-center hover:scale-105 transition"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-mosh-black" />
            ) : (
              <Play className="w-4 h-4 text-mosh-black ml-0.5" />
            )}
          </button>
          
          <button 
            onClick={playNext}
            className="p-1 text-mosh-text hover:text-mosh-light transition"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          
          <button 
            onClick={toggleRepeat}
            className={`p-1 hover:text-mosh-light transition ${repeat !== 'none' ? 'text-mosh-accent' : 'text-mosh-muted'}`}
          >
            {repeat === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xl flex items-center gap-2">
          <span className="text-xs text-mosh-muted w-10 text-right">
            {formatDuration(currentTime)}
          </span>
          <div 
            className="flex-1 h-1 bg-mosh-border rounded-full cursor-pointer group"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-mosh-text group-hover:bg-mosh-accent rounded-full relative transition-colors"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-mosh-light rounded-full opacity-0 group-hover:opacity-100 transition" />
            </div>
          </div>
          <span className="text-xs text-mosh-muted w-10">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume - Right */}
      <div className="w-1/4 flex justify-end items-center gap-2">
        <button 
          onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
          className="p-1 text-mosh-muted hover:text-mosh-light transition"
        >
          {volume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        <div 
          className="w-24 h-1 bg-mosh-border rounded-full cursor-pointer group"
          onClick={handleVolumeChange}
        >
          <div 
            className="h-full bg-mosh-text group-hover:bg-mosh-accent rounded-full transition-colors"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
