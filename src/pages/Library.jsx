import { useState, useEffect } from 'react'
import { library as libraryAPI, playlists as playlistsAPI } from '../utils/api'
import SongRow from '../components/SongRow'
import EditSongModal from '../components/EditSongModal'
import BulkActionsBar from '../components/BulkActionsBar'
import BulkEditModal from '../components/BulkEditModal'
import { Clock, Music, Loader2, Search, CheckSquare, Square } from 'lucide-react'

export default function Library() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  const [editingSong, setEditingSong] = useState(null)
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    loadLibrary()
  }, [sortBy, sortOrder])

  const loadLibrary = async () => {
    setLoading(true)
    try {
      const data = await libraryAPI.getAll({ sort: sortBy, order: sortOrder })
      setSongs(data.songs || [])
      // Clear selection when library reloads
      setSelectedIds(new Set())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle song deletion
  const handleDelete = (songId) => {
    setSongs(prev => prev.filter(s => s.id !== songId))
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(songId)
      return next
    })
  }

  // Handle song edit
  const handleEdit = (song) => {
    setEditingSong(song)
  }

  // Handle song update from modal
  const handleSongUpdated = (updatedSong) => {
    setSongs(prev => prev.map(s => s.id === updatedSong.id ? updatedSong : s))
    setEditingSong(null)
  }

  // Filter songs by search
  const filteredSongs = songs.filter(song => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      song.title?.toLowerCase().includes(searchLower) ||
      song.artist?.toLowerCase().includes(searchLower) ||
      song.album?.toLowerCase().includes(searchLower)
    )
  })

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(field)
      setSortOrder('ASC')
    }
  }

  // Selection handlers
  const toggleSelect = (songId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(songId)) {
        next.delete(songId)
      } else {
        next.add(songId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSongs.length) {
      // Deselect all
      setSelectedIds(new Set())
    } else {
      // Select all filtered
      setSelectedIds(new Set(filteredSongs.map(s => s.id)))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  // Bulk actions
  const handleBulkDelete = async () => {
    const count = selectedIds.size
    if (!confirm(`Delete ${count} song${count !== 1 ? 's' : ''}? This cannot be undone.`)) {
      return
    }

    setBulkLoading(true)
    try {
      await libraryAPI.bulkDelete(Array.from(selectedIds))
      // Remove deleted songs from state
      setSongs(prev => prev.filter(s => !selectedIds.has(s.id)))
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Bulk delete failed:', err)
      alert('Failed to delete songs: ' + err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkAddToPlaylist = async (playlistId) => {
    setBulkLoading(true)
    try {
      const result = await playlistsAPI.addSongsBulk(playlistId, Array.from(selectedIds))
      alert(`Added ${result.addedCount} song${result.addedCount !== 1 ? 's' : ''} to playlist`)
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Bulk add to playlist failed:', err)
      alert('Failed to add songs to playlist: ' + err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkFetchArtwork = async () => {
    const count = selectedIds.size
    if (count > 50) {
      alert('Maximum 50 songs for artwork fetch. Please select fewer songs.')
      return
    }

    setBulkLoading(true)
    try {
      const result = await libraryAPI.bulkFetchArtwork(Array.from(selectedIds))
      
      // Update songs with new artwork
      if (result.updated && result.updated.length > 0) {
        setSongs(prev => prev.map(song => {
          const updated = result.updated.find(u => u.id === song.id)
          if (updated) {
            return { ...song, artwork_url: updated.artwork_url }
          }
          return song
        }))
      }

      // Show results
      let msg = `Artwork fetch complete:\n`
      if (result.updated?.length) msg += `✓ Updated: ${result.updated.length}\n`
      if (result.notFound?.length) msg += `○ Not found: ${result.notFound.length}\n`
      if (result.failed?.length) msg += `✗ Failed: ${result.failed.length}`
      alert(msg)
      
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Bulk fetch artwork failed:', err)
      alert('Failed to fetch artwork: ' + err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkParseFilename = async () => {
    const count = selectedIds.size
    if (count > 100) {
      alert('Maximum 100 songs per request. Please select fewer songs.')
      return
    }

    setBulkLoading(true)
    try {
      const result = await libraryAPI.bulkParseFilename(Array.from(selectedIds))
      
      // Update songs with new metadata
      if (result.updated && result.updated.length > 0) {
        setSongs(prev => prev.map(song => {
          const updated = result.updated.find(u => u.id === song.id)
          if (updated) {
            return { 
              ...song, 
              title: updated.newTitle,
              artist: updated.newArtist
            }
          }
          return song
        }))
      }

      // Show results
      let msg = `Filename parsing complete:\n`
      if (result.updated?.length) msg += `✓ Updated: ${result.updated.length}\n`
      if (result.skipped?.length) msg += `○ Skipped: ${result.skipped.length}\n`
      if (result.failed?.length) msg += `✗ Failed: ${result.failed.length}`
      alert(msg)
      
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Bulk parse filename failed:', err)
      alert('Failed to parse filenames: ' + err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkEdit = () => {
    setShowBulkEdit(true)
  }

  const handleBulkEditSave = (result) => {
    // Refresh library to get updated data
    loadLibrary()
  }

  // Get selected songs for bulk edit modal
  const selectedSongs = songs.filter(s => selectedIds.has(s.id))

  const allSelected = filteredSongs.length > 0 && selectedIds.size === filteredSongs.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredSongs.length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-mosh-light">Your Library</h1>
        <div className="text-mosh-text">
          {songs.length} song{songs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mosh-muted" />
          <input
            type="text"
            placeholder="Search your library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-mosh-card border border-mosh-border rounded-md text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent transition"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value)}
          className="px-4 py-2 bg-mosh-card border border-mosh-border rounded-md text-mosh-light focus:outline-none focus:border-mosh-accent transition cursor-pointer"
        >
          <option value="created_at">Date Added</option>
          <option value="title">Title</option>
          <option value="artist">Artist</option>
          <option value="album">Album</option>
          <option value="duration">Duration</option>
        </select>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onAddToPlaylist={handleBulkAddToPlaylist}
        onEdit={handleBulkEdit}
        onFetchArtwork={handleBulkFetchArtwork}
        onParseFilename={handleBulkParseFilename}
      />

      {/* Bulk loading overlay */}
      {bulkLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-mosh-card rounded-lg p-6 flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-mosh-accent animate-spin" />
            <span className="text-mosh-light">Processing...</span>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-mosh-accent animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-400 py-8 text-center">
          {error}
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="bg-mosh-card rounded-lg p-8 text-center">
          <Music className="w-12 h-12 text-mosh-muted mx-auto mb-4" />
          {search ? (
            <>
              <h3 className="text-lg font-medium text-mosh-light mb-2">
                No results found
              </h3>
              <p className="text-mosh-text">
                Try a different search term
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      ) : (
        <div className="bg-mosh-dark rounded-lg">
          {/* Header Row */}
          <div className="flex items-center px-4 py-3 border-b border-mosh-border text-sm text-mosh-muted">
            {/* Select All Checkbox */}
            <button
              onClick={toggleSelectAll}
              className="w-8 flex justify-center text-mosh-muted hover:text-mosh-light transition"
              title={allSelected ? 'Deselect all' : 'Select all'}
            >
              {allSelected ? (
                <CheckSquare className="w-5 h-5 text-mosh-accent" />
              ) : someSelected ? (
                <div className="w-5 h-5 border-2 border-mosh-accent bg-mosh-accent/30 rounded flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-mosh-accent" />
                </div>
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            <div className="w-8 text-center">#</div>
            <div className="w-10 ml-3" />
            <div 
              className="ml-3 flex-1 cursor-pointer hover:text-mosh-light transition"
              onClick={() => handleSort('title')}
            >
              Title {sortBy === 'title' && (sortOrder === 'ASC' ? '↑' : '↓')}
            </div>
            <div 
              className="hidden md:block w-1/4 px-4 cursor-pointer hover:text-mosh-light transition"
              onClick={() => handleSort('album')}
            >
              Album {sortBy === 'album' && (sortOrder === 'ASC' ? '↑' : '↓')}
            </div>
            <div className="w-16 text-right">
              <Clock className="w-4 h-4 inline" />
            </div>
            <div className="w-9" />
          </div>

          {/* Song Rows */}
          {filteredSongs.map((song, index) => (
            <SongRow 
              key={song.id} 
              song={song} 
              index={index}
              queue={filteredSongs}
              onDelete={handleDelete}
              onEdit={handleEdit}
              isSelected={selectedIds.has(song.id)}
              onToggleSelect={() => toggleSelect(song.id)}
              showCheckbox={true}
            />
          ))}
        </div>
      )}

      {/* Edit Modal (single song) */}
      {editingSong && (
        <EditSongModal
          song={editingSong}
          onClose={() => setEditingSong(null)}
          onSave={handleSongUpdated}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <BulkEditModal
          selectedSongs={selectedSongs}
          onClose={() => setShowBulkEdit(false)}
          onSave={handleBulkEditSave}
        />
      )}
    </div>
  )
}
