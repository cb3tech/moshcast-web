import { useState, useEffect } from 'react'
import { library as libraryAPI } from '../utils/api'
import SongRow from '../components/SongRow'
import { Clock, Music, Loader2, Search } from 'lucide-react'

export default function Library() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')

  useEffect(() => {
    loadLibrary()
  }, [sortBy, sortOrder])

  const loadLibrary = async () => {
    setLoading(true)
    try {
      const data = await libraryAPI.getAll({ sort: sortBy, order: sortOrder })
      setSongs(data.songs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
        </select>
      </div>

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
            />
          ))}
        </div>
      )}
    </div>
  )
}
