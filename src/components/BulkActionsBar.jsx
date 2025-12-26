import { useState, useEffect } from 'react'
import { Trash2, ListPlus, Edit2, Image, X, Plus, Music, Loader2, FileText } from 'lucide-react'
import { playlists as playlistsAPI } from '../utils/api'

export default function BulkActionsBar({ 
  selectedCount, 
  onClear, 
  onDelete, 
  onAddToPlaylist, 
  onEdit,
  onFetchArtwork,
  onParseFilename
}) {
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false)
  const [playlists, setPlaylists] = useState([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [creating, setCreating] = useState(false)

  // Load playlists when dropdown opens
  useEffect(() => {
    if (showPlaylistDropdown) {
      loadPlaylists()
    }
  }, [showPlaylistDropdown])

  const loadPlaylists = async () => {
    setLoadingPlaylists(true)
    try {
      const data = await playlistsAPI.getAll()
      setPlaylists(data.playlists || [])
    } catch (err) {
      console.error('Failed to load playlists:', err)
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const handleSelectPlaylist = (playlistId) => {
    onAddToPlaylist(playlistId)
    setShowPlaylistDropdown(false)
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return
    
    setCreating(true)
    try {
      const data = await playlistsAPI.create({ name: newPlaylistName.trim() })
      // Add to new playlist immediately
      onAddToPlaylist(data.playlist.id)
      setShowPlaylistDropdown(false)
      setShowNewPlaylist(false)
      setNewPlaylistName('')
    } catch (err) {
      console.error('Failed to create playlist:', err)
      alert('Failed to create playlist')
    } finally {
      setCreating(false)
    }
  }

  if (selectedCount === 0) return null

  return (
    <div className="sticky top-0 z-40 mb-4">
      <div className="bg-mosh-accent/10 border border-mosh-accent/30 rounded-lg px-4 py-3 flex items-center gap-4 backdrop-blur-sm">
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <span className="text-mosh-accent font-medium">
            {selectedCount} selected
          </span>
          <button
            onClick={onClear}
            className="p-1 text-mosh-muted hover:text-mosh-light transition"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-mosh-border" />

        {/* Actions */}
        <div className="flex items-center gap-2 flex-1">
          {/* Add to Playlist */}
          <div className="relative">
            <button
              onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-mosh-card hover:bg-mosh-hover border border-mosh-border rounded-md text-sm text-mosh-light transition"
            >
              <ListPlus className="w-4 h-4" />
              Add to Playlist
            </button>

            {/* Playlist Dropdown */}
            {showPlaylistDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-mosh-card border border-mosh-border rounded-lg shadow-xl z-50 overflow-hidden">
                {/* Create new playlist */}
                {showNewPlaylist ? (
                  <div className="p-3 border-b border-mosh-border">
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Playlist name"
                      className="w-full px-3 py-2 bg-mosh-dark border border-mosh-border rounded text-sm text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleCreatePlaylist}
                        disabled={creating || !newPlaylistName.trim()}
                        className="flex-1 px-3 py-1.5 bg-mosh-accent text-mosh-black text-sm font-medium rounded hover:bg-mosh-accent-hover disabled:opacity-50 transition"
                      >
                        {creating ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        onClick={() => {
                          setShowNewPlaylist(false)
                          setNewPlaylistName('')
                        }}
                        className="px-3 py-1.5 text-sm text-mosh-muted hover:text-mosh-light transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewPlaylist(true)}
                    className="w-full px-4 py-3 text-left text-sm text-mosh-accent hover:bg-mosh-hover flex items-center gap-2 border-b border-mosh-border"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Playlist
                  </button>
                )}

                {/* Existing playlists */}
                <div className="max-h-64 overflow-y-auto">
                  {loadingPlaylists ? (
                    <div className="p-4 text-center text-mosh-muted text-sm">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                      Loading...
                    </div>
                  ) : playlists.length === 0 ? (
                    <div className="p-4 text-center text-mosh-muted text-sm">
                      No playlists yet
                    </div>
                  ) : (
                    playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => handleSelectPlaylist(playlist.id)}
                        className="w-full px-4 py-2.5 text-left text-sm text-mosh-light hover:bg-mosh-hover flex items-center gap-3 transition"
                      >
                        <div className="w-8 h-8 bg-mosh-dark rounded flex items-center justify-center flex-shrink-0">
                          <Music className="w-4 h-4 text-mosh-muted" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{playlist.name}</p>
                          <p className="text-xs text-mosh-muted">{playlist.song_count || 0} songs</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Close */}
                <button
                  onClick={() => setShowPlaylistDropdown(false)}
                  className="w-full px-4 py-2 text-center text-xs text-mosh-muted hover:text-mosh-light border-t border-mosh-border"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Parse Filename */}
          <button
            onClick={onParseFilename}
            className="flex items-center gap-2 px-3 py-1.5 bg-mosh-card hover:bg-mosh-hover border border-mosh-border rounded-md text-sm text-mosh-light transition"
            title="Extract artist/title from filename"
          >
            <FileText className="w-4 h-4" />
            Parse Filename
          </button>

          {/* Edit Metadata */}
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-1.5 bg-mosh-card hover:bg-mosh-hover border border-mosh-border rounded-md text-sm text-mosh-light transition"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>

          {/* Fetch Artwork */}
          <button
            onClick={onFetchArtwork}
            className="flex items-center gap-2 px-3 py-1.5 bg-mosh-card hover:bg-mosh-hover border border-mosh-border rounded-md text-sm text-mosh-light transition"
            title="Fetch album artwork from iTunes"
          >
            <Image className="w-4 h-4" />
            Get Artwork
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-md text-sm text-red-400 transition"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      {/* Click outside to close dropdown */}
      {showPlaylistDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowPlaylistDropdown(false)}
        />
      )}
    </div>
  )
}
