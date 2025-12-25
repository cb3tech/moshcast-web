import { useState, useRef, useEffect } from 'react'
import { Play, Pause, MoreHorizontal, Music, Trash2, Edit2, ListPlus, Plus, X } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { formatDuration } from '../utils/format'
import { library as libraryAPI, playlists as playlistsAPI } from '../utils/api'

export default function SongRow({ song, index, queue = [], showIndex = true, onDelete, onEdit }) {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer()
  const { token } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [playlists, setPlaylists] = useState([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [addingToPlaylist, setAddingToPlaylist] = useState(null)
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

  const handleAddToPlaylist = async (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    setShowPlaylistModal(true)
    setLoadingPlaylists(true)
    
    try {
      const data = await playlistsAPI.getAll()
      setPlaylists(data.playlists || [])
    } catch (err) {
      console.error('Failed to load playlists:', err)
      alert('Failed to load playlists')
      setShowPlaylistModal(false)
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const addSongToPlaylist = async (playlistId) => {
    setAddingToPlaylist(playlistId)
    
    try {
      await playlistsAPI.addSong(playlistId, song.id)
      setShowPlaylistModal(false)
      // Optional: show success toast
    } catch (err) {
      console.error('Failed to add song to playlist:', err)
      alert('Failed to add song: ' + (err.message || 'Unknown error'))
    } finally {
      setAddingToPlaylist(null)
    }
  }

  return (
    <>
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
            <div className="absolute right-0 top-8 w-48 bg-mosh-card border border-mosh-border rounded-md shadow-lg z-50 py-1">
              <button
                className="w-full px-4 py-2 text-left text-sm text-mosh-light hover:bg-mosh-hover flex items-center gap-2"
                onClick={handleAddToPlaylist}
              >
                <ListPlus className="w-4 h-4" />
                Add to playlist
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-mosh-light hover:bg-mosh-hover flex items-center gap-2"
                onClick={handleEdit}
              >
                <Edit2 className="w-4 h-4" />
                Edit details
              </button>
              <div className="border-t border-mosh-border my-1" />
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

      {/* Add to Playlist Modal */}
      {showPlaylistModal && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowPlaylistModal(false)}
        >
          <div 
            className="bg-mosh-dark border border-mosh-border rounded-xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-mosh-border">
              <h3 className="font-bold text-mosh-light">Add to Playlist</h3>
              <button 
                onClick={() => setShowPlaylistModal(false)}
                className="p-1 text-mosh-muted hover:text-mosh-light transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Song being added */}
            <div className="px-4 py-3 bg-mosh-card/50 flex items-center gap-3">
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
              <div className="min-w-0">
                <p className="text-sm font-medium text-mosh-light truncate">{song.title}</p>
                <p className="text-xs text-mosh-muted truncate">{song.artist || 'Unknown Artist'}</p>
              </div>
            </div>

            {/* Playlist List */}
            <div className="max-h-64 overflow-y-auto">
              {loadingPlaylists ? (
                <div className="p-8 text-center text-mosh-muted">
                  Loading playlists...
                </div>
              ) : playlists.length === 0 ? (
                <div className="p-8 text-center text-mosh-muted">
                  <p>No playlists yet</p>
                  <p className="text-xs mt-1">Create a playlist first</p>
                </div>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => addSongToPlaylist(playlist.id)}
                    disabled={addingToPlaylist === playlist.id}
                    className="w-full px-4 py-3 text-left hover:bg-mosh-hover transition flex items-center gap-3 disabled:opacity-50"
                  >
                    <div className="w-10 h-10 bg-mosh-card rounded flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4 text-mosh-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-mosh-light truncate">
                        {playlist.name}
                      </p>
                      <p className="text-xs text-mosh-muted">
                        {playlist.song_count || 0} songs
                      </p>
                    </div>
                    {addingToPlaylist === playlist.id ? (
                      <span className="text-xs text-mosh-accent">Adding...</span>
                    ) : (
                      <Plus className="w-5 h-5 text-mosh-muted" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-mosh-border">
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="w-full py-2 text-sm text-mosh-muted hover:text-mosh-light transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
