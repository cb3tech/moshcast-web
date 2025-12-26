import { useState } from 'react'
import { X, Save, Image, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { library as libraryAPI } from '../utils/api'

export default function BulkEditModal({ selectedSongs, onClose, onSave }) {
  const [formData, setFormData] = useState({
    artist: '',
    album: '',
    genre: '',
    year: ''
  })
  const [saving, setSaving] = useState(false)
  const [fetchingArtwork, setFetchingArtwork] = useState(false)
  const [artworkResults, setArtworkResults] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    // Filter out empty fields
    const updates = {}
    if (formData.artist.trim()) updates.artist = formData.artist.trim()
    if (formData.album.trim()) updates.album = formData.album.trim()
    if (formData.genre.trim()) updates.genre = formData.genre.trim()
    if (formData.year.trim()) updates.year = parseInt(formData.year) || null

    if (Object.keys(updates).length === 0) {
      alert('Please fill in at least one field to update')
      return
    }

    setSaving(true)
    try {
      const songIds = selectedSongs.map(s => s.id)
      const result = await libraryAPI.bulkUpdate(songIds, updates)
      
      // Pass updated data back to parent
      onSave(result)
      onClose()
    } catch (err) {
      console.error('Bulk update failed:', err)
      alert('Failed to update songs: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleFetchArtwork = async () => {
    setFetchingArtwork(true)
    setArtworkResults(null)
    
    try {
      const songIds = selectedSongs.map(s => s.id)
      const result = await libraryAPI.bulkFetchArtwork(songIds)
      setArtworkResults(result)
      
      // If any were updated, notify parent
      if (result.updated && result.updated.length > 0) {
        // Parent will need to refresh
        onSave({ artworkUpdated: result.updated })
      }
    } catch (err) {
      console.error('Artwork fetch failed:', err)
      alert('Failed to fetch artwork: ' + err.message)
    } finally {
      setFetchingArtwork(false)
    }
  }

  const hasUpdates = formData.artist || formData.album || formData.genre || formData.year

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-mosh-dark border border-mosh-border rounded-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-mosh-border">
          <h2 className="text-lg font-bold text-mosh-light">
            Edit {selectedSongs.length} Song{selectedSongs.length !== 1 ? 's' : ''}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-mosh-muted hover:text-mosh-light transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-mosh-muted mb-4">
            Leave fields blank to keep existing values. Filled fields will update all selected songs.
          </p>

          {/* Artist */}
          <div>
            <label className="block text-sm font-medium text-mosh-text mb-1">
              Artist
            </label>
            <input
              type="text"
              name="artist"
              value={formData.artist}
              onChange={handleChange}
              placeholder="Set artist for all selected..."
              className="w-full px-3 py-2 bg-mosh-card border border-mosh-border rounded-md text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent transition"
            />
          </div>

          {/* Album */}
          <div>
            <label className="block text-sm font-medium text-mosh-text mb-1">
              Album
            </label>
            <input
              type="text"
              name="album"
              value={formData.album}
              onChange={handleChange}
              placeholder="Set album for all selected..."
              className="w-full px-3 py-2 bg-mosh-card border border-mosh-border rounded-md text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent transition"
            />
          </div>

          {/* Genre & Year row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-mosh-text mb-1">
                Genre
              </label>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                placeholder="Set genre..."
                className="w-full px-3 py-2 bg-mosh-card border border-mosh-border rounded-md text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-mosh-text mb-1">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="Set year..."
                min="1900"
                max="2099"
                className="w-full px-3 py-2 bg-mosh-card border border-mosh-border rounded-md text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent transition"
              />
            </div>
          </div>

          {/* Artwork Section */}
          <div className="pt-4 border-t border-mosh-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-mosh-light">Album Artwork</h3>
                <p className="text-xs text-mosh-muted">Fetch from iTunes based on artist/album</p>
              </div>
              <button
                onClick={handleFetchArtwork}
                disabled={fetchingArtwork}
                className="flex items-center gap-2 px-3 py-1.5 bg-mosh-card hover:bg-mosh-hover border border-mosh-border rounded-md text-sm text-mosh-light transition disabled:opacity-50"
              >
                {fetchingArtwork ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Image className="w-4 h-4" />
                    Fetch Artwork
                  </>
                )}
              </button>
            </div>

            {/* Artwork Results */}
            {artworkResults && (
              <div className="bg-mosh-card rounded-md p-3 text-sm space-y-2">
                {artworkResults.updated?.length > 0 && (
                  <div className="flex items-start gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Updated artwork for {artworkResults.updated.length} song{artworkResults.updated.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {artworkResults.notFound?.length > 0 && (
                  <div className="flex items-start gap-2 text-yellow-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>No artwork found for {artworkResults.notFound.length} song{artworkResults.notFound.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {artworkResults.failed?.length > 0 && (
                  <div className="flex items-start gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Failed for {artworkResults.failed.length} song{artworkResults.failed.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-mosh-border bg-mosh-card/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-mosh-muted hover:text-mosh-light transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasUpdates}
            className="flex items-center gap-2 px-4 py-2 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-medium rounded-md transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
