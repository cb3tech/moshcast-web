import { useState, useEffect } from 'react'
import { Newspaper, RefreshCw, ExternalLink, Loader2, Rss, Filter, Clock } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { api } from '../utils/api'

export default function News() {
  const [articles, setArticles] = useState([])
  const [feeds, setFeeds] = useState([])
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadFeeds()
    loadNews()
  }, [])

  useEffect(() => {
    loadNews()
  }, [selectedGenre])

  const loadFeeds = async () => {
    try {
      const data = await api.get('/feeds')
      setFeeds(data.feeds || [])
      
      // Extract unique genres
      const uniqueGenres = [...new Set(data.feeds?.map(f => f.genre_tag).filter(Boolean))]
      setGenres(uniqueGenres)
    } catch (err) {
      console.error('Failed to load feeds:', err)
    }
  }

  const loadNews = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = selectedGenre ? `?genre=${selectedGenre}` : ''
      const data = await api.get(`/feeds/news${params}`)
      setArticles(data.articles || [])
    } catch (err) {
      console.error('Failed to load news:', err)
      setError(err.message || 'Failed to load news')
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    await loadNews()
    setRefreshing(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const enabledFeeds = feeds.filter(f => f.enabled)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-mosh-accent" />
          <h1 className="text-3xl font-bold text-mosh-light">Music News</h1>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-mosh-hover hover:bg-mosh-border text-mosh-light rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* No Feeds State */}
      {enabledFeeds.length === 0 && !loading && (
        <div className="bg-mosh-dark rounded-xl p-12 text-center">
          <Rss className="w-16 h-16 text-mosh-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-mosh-light mb-2">No News Feeds</h2>
          <p className="text-mosh-muted mb-6">
            Add some RSS feeds in Settings to see music news here.
          </p>
          <NavLink
            to="/settings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-mosh-accent hover:bg-mosh-accent/80 text-white font-semibold rounded-lg transition"
          >
            <Rss className="w-4 h-4" />
            Manage Feeds
          </NavLink>
        </div>
      )}

      {/* Filters */}
      {enabledFeeds.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-4 h-4 text-mosh-muted" />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedGenre === ''
                  ? 'bg-mosh-accent text-white'
                  : 'bg-mosh-hover text-mosh-light hover:bg-mosh-border'
              }`}
            >
              All
            </button>
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedGenre === genre
                    ? 'bg-mosh-accent text-white'
                    : 'bg-mosh-hover text-mosh-light hover:bg-mosh-border'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-mosh-accent animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-mosh-hover hover:bg-mosh-border text-mosh-light rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Articles Grid */}
      {!loading && !error && articles.length > 0 && (
        <div className="grid gap-6">
          {articles.map((article, idx) => (
            <a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-mosh-dark hover:bg-mosh-hover rounded-xl overflow-hidden transition flex"
            >
              {/* Image */}
              {article.image ? (
                <div className="w-48 h-36 flex-shrink-0 bg-mosh-darker">
                  <img
                    src={article.image}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              ) : (
                <div className="w-48 h-36 flex-shrink-0 bg-mosh-darker flex items-center justify-center">
                  <Newspaper className="w-12 h-12 text-mosh-border" />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-mosh-light group-hover:text-mosh-accent transition line-clamp-2">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-mosh-muted text-sm mt-2 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-mosh-muted">
                      {article.source && (
                        <span className="font-medium text-mosh-accent">{article.source}</span>
                      )}
                      {article.genre && (
                        <span className="px-2 py-0.5 bg-mosh-hover rounded">{article.genre}</span>
                      )}
                      {article.pubDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(article.pubDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-mosh-muted group-hover:text-mosh-accent transition flex-shrink-0" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && articles.length === 0 && enabledFeeds.length > 0 && (
        <div className="bg-mosh-dark rounded-xl p-12 text-center">
          <Newspaper className="w-16 h-16 text-mosh-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-mosh-light mb-2">No Articles Found</h2>
          <p className="text-mosh-muted">
            {selectedGenre 
              ? `No articles found for "${selectedGenre}". Try another genre or check back later.`
              : 'No articles found. Your feeds may be empty or having issues.'}
          </p>
        </div>
      )}

      {/* Feed Status */}
      {enabledFeeds.length > 0 && !loading && (
        <div className="mt-8 pt-6 border-t border-mosh-border">
          <div className="flex items-center justify-between text-sm text-mosh-muted">
            <span>Showing news from {enabledFeeds.length} feed{enabledFeeds.length !== 1 ? 's' : ''}</span>
            <NavLink
              to="/settings"
              className="flex items-center gap-1 hover:text-mosh-accent transition"
            >
              <Rss className="w-4 h-4" />
              Manage Feeds
            </NavLink>
          </div>
        </div>
      )}
    </div>
  )
}
