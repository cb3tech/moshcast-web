import { useState, useEffect } from 'react'
import { playlists as playlistsAPI } from '../utils/api'
import { 
  Plus, ListMusic, Loader2, Play, MoreHorizontal, 
  Trash2, Copy, Check, Lock, Globe, X
} from 'lucide-react'
import { formatDuration } from '../utils/format'

export default function Playlists() {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [menuOpen, setMenuOpen] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)

  useEffect(() => {
    loadPlaylists()
  }, [])

  const loadPlaylists = async () => {
    try {
      const data = await playlistsAPI.getAll()
      setPlaylists(data.playlists || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return

    setCreating(true)
    try {
      const data = await playlistsAPI.create({
        name: newName.trim(),
        description: newDesc.trim() || null
      })
      setPlaylists(prev => [data.playlist, ...prev])
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
    } catch (err) {
      alert('Failed to create playlist: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this playlist?')) return

    try {
      await playlistsAPI.delete(id)
      setPlaylists(prev => prev.filter(p => p.id !== id))
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(null)
      }
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
    setMenuOpen(null)
  }

  const handleTogglePublic = async (playlist) => {
    try {
      await playlistsAPI.update(playlist.id, {
        is_public: !playlist.is_public
      })
      setPlaylists(prev => prev.map(p => 
        p.id === playlist.id ? { ...p, is_public: !p.is_public } : p
      ))
    } catch (err) {
      alert('Failed to update: ' + err.message)
    }
    setMenuOpen(null)
  }

  const copyShareLink = (playlist) => {
    const link = `${window.location.origin}/playlist/${playlist.share_code}`
    navigator.clipboard.writeText(link)
    setCopiedId(playlist.id)
    setTimeout(() => setCopiedId(null), 2000)
    setMenuOpen(null)
  }

  const shareToSocial = (playlist, platform) => {
    const link = `${window.location.origin}/playlist/${playlist.share_code}`
    const text = `Check out my playlist "${playlist.name}" on Moshcast!`
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    }
    
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
    setMenuOpen(null)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-mosh-light">Playlists</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-medium rounded-full transition"
        >
          <Plus className="w-5 h-5" />
          New Playlist
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-mosh-accent animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-400 py-8 text-center">{error}</div>
      ) : playlists.length === 0 ? (
        <div className="bg-mosh-card rounded-lg p-8 text-center">
          <ListMusic className="w-12 h-12 text-mosh-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-mosh-light mb-2">
            No playlists yet
          </h3>
          <p className="text-mosh-text mb-4">
            Create your first playlist to organize your music
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-2 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-medium rounded-full transition"
          >
            <Plus className="w-5 h-5" />
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="group bg-mosh-card hover:bg-mosh-hover rounded-lg p-4 transition cursor-pointer relative"
              onClick={() => setSelectedPlaylist(playlist)}
            >
              {/* Playlist Art */}
              <div className="aspect-square bg-gradient-to-br from-mosh-accent/30 to-mosh-dark rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <ListMusic className="w-16 h-16 text-mosh-accent/50" />
                <button 
                  className="absolute bottom-2 right-2 p-3 bg-mosh-accent rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-lg hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation()
                    // TODO: Play playlist
                  }}
                >
                  <Play className="w-5 h-5 text-mosh-black ml-0.5" />
                </button>
              </div>

              {/* Info */}
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-mosh-light truncate">
                    {playlist.name}
                  </h3>
                  <p className="text-sm text-mosh-muted">
                    {playlist.song_count || 0} songs • {formatDuration(playlist.total_duration || 0)}
                  </p>
                </div>

                {/* Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(menuOpen === playlist.id ? null : playlist.id)
                    }}
                    className="p-1 text-mosh-muted hover:text-mosh-light opacity-0 group-hover:opacity-100 transition"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {menuOpen === playlist.id && (
                    <div 
                      className="absolute right-0 top-8 w-48 bg-mosh-dark border border-mosh-border rounded-lg shadow-xl z-20 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleTogglePublic(playlist)}
                        className="w-full px-4 py-2 text-left text-sm text-mosh-light hover:bg-mosh-hover flex items-center gap-2"
                      >
                        {playlist.is_public ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Make Private
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4" />
                            Make Public
                          </>
                        )}
                      </button>
                      
                      {playlist.is_public && (
                        <>
                          <button
                            onClick={() => copyShareLink(playlist)}
                            className="w-full px-4 py-2 text-left text-sm text-mosh-light hover:bg-mosh-hover flex items-center gap-2"
                          >
                            {copiedId === playlist.id ? (
                              <>
                                <Check className="w-4 h-4 text-mosh-accent" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy Link
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => shareToSocial(playlist, 'twitter')}
                            className="w-full px-4 py-2 text-left text-sm text-mosh-light hover:bg-mosh-hover flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            Share to X
                          </button>
                        </>
                      )}

                      <div className="border-t border-mosh-border my-1" />
                      
                      <button
                        onClick={() => handleDelete(playlist.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-mosh-hover flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Public/Private badge */}
              <div className="mt-2">
                {playlist.is_public ? (
                  <span className="inline-flex items-center gap-1 text-xs text-mosh-accent">
                    <Globe className="w-3 h-3" />
                    Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-mosh-muted">
                    <Lock className="w-3 h-3" />
                    Private
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-mosh-dark rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-mosh-border">
              <h2 className="text-lg font-bold text-mosh-light">Create Playlist</h2>
              <button 
                onClick={() => setShowCreate(false)}
                className="p-1 text-mosh-muted hover:text-mosh-light transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-mosh-text mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  className="w-full px-3 py-2 bg-mosh-card border border-mosh-border rounded text-mosh-light focus:outline-none focus:border-mosh-accent transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-mosh-text mb-1">Description (optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What's this playlist about?"
                  rows={3}
                  className="w-full px-3 py-2 bg-mosh-card border border-mosh-border rounded text-mosh-light focus:outline-none focus:border-mosh-accent transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-mosh-text hover:text-mosh-light transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="px-6 py-2 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-medium rounded-full transition disabled:opacity-50 flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
