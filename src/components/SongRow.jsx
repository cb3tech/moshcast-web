import { useState, useRef, useEffect } from 'react'
import { Play, Pause, MoreHorizontal, Music, Trash2, Edit2 } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { formatDuration } from '../utils/format'
import { library as libraryAPI } from '../utils/api'

export default function SongRow({ song, index, queue = [], showIndex = true, onDelete, onEdit }) {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef(null)
  
  const isCurrentSong = currentSong?.id === song.id
  const isThisPlaying = isCurrentSong && isPlaying

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

  const handleClick = () => {
    if (isCurrentSong) {
      togglePlay()
    } else {
      playSong(song, queue, index)
    }
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    
    if (!confirm(`Delete "${song.title}"? This cannot be undone.`)) {
      return
    }
    
    setDeleting(true)
    setMenuOpen(false)
    
    try {
      await libraryAPI.deleteSong(song.id)
      if (onDelete) {
        onDelete(song.id)
      }
    } catch (err) {
      alert('Failed to delete song: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    if (onEdit) {
      onEdit(song)
    }
  }

  return (
    <div 
      className={`group flex items-center px-4 py-2 rounded-md hover:bg-mosh-hover transition cursor-pointer ${
        isCurrentSong ? 'bg-mosh-hover' : ''
      } ${deleting ? 'opacity-50 pointer-events-none' : ''}`}
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
      <div className="relative ml-4" ref={menuRef}>
        <button 
          className="p-1 opacity-0 group-hover:opacity-100 text-mosh-muted hover:text-mosh-light transition"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
        
        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-0 top-8 w-40 bg-mosh-card border border-mosh-border rounded-md shadow-lg z-50 py-1">
            <button
              className="w-full px-4 py-2 text-left text-sm text-mosh-light hover:bg-mosh-hover flex items-center gap-2"
              onClick={handleEdit}
            >
              <Edit2 className="w-4 h-4" />
              Edit details
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-mosh-hover flex items-center gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
