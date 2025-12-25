import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { library as libraryAPI } from '../utils/api'

export default function EditSongModal({ song, onClose, onSave }) {
  const [title, setTitle] = useState(song.title || '')
  const [artist, setArtist] = useState(song.artist || '')
  const [album, setAlbum] = useState(song.album || '')
  const [year, setYear] = useState(song.year || '')
  const [genre, setGenre] = useState(song.genre || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const result = await libraryAPI.updateSong(song.id, {
        title,
        artist,
        album,
        year: year ? parseInt(year) : null,
        genre
      })
      onSave(result.song)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-mosh-dark rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-mosh-border">
          <h2 className="text-lg font-bold text-mosh-light">Edit details</h2>
          <button 
            onClick={onClose}
            className="p-1 text-mosh-muted hover:text-mosh-light transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-mosh-text mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-mosh-card border border-mosh-border rounded text-mosh-light focus:outline-none focus:border-mosh-accent transition"
            />
          </div>

          <div>
            <label className="block text-sm text-mosh-text mb-1">Artist</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-3 py-2 bg-mosh-card border border-mosh-border rounded text-mosh-light focus:outline-none focus:border-mosh-accent transition"
            />
          </div>

          <div>
            <label className="block text-sm text-mosh-text mb-1">Album</label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="w-full px-3 py-2 bg-mosh-card border border-mosh-border rounded text-mosh-light focus:outline-none focus:border-mosh-accent transition"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-mosh-text mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                min="1900"
                max="2099"
                className="w-full px-3 py-2 bg-mosh-card border border-mosh-border rounded text-mosh-light focus:outline-none focus:border-mosh-accent transition"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-mosh-text mb-1">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Rock"
                className="w-full px-3 py-2 bg-mosh-card border border-mosh-border rounded text-mosh-light focus:outline-none focus:border-mosh-accent transition"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-mosh-text hover:text-mosh-light transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-medium rounded-full transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
