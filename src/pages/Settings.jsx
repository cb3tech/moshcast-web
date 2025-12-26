import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Rss, Plus, Trash2, RefreshCw, Save, RotateCcw, Loader2, ExternalLink, Music } from 'lucide-react'
import { api } from '../utils/api'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('playback')
  const [settings, setSettings] = useState(null)
  const [feeds, setFeeds] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  
  // New feed form
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [newFeedName, setNewFeedName] = useState('')
  const [newFeedGenre, setNewFeedGenre] = useState('')
  const [addingFeed, setAddingFeed] = useState(false)

  useEffect(() => {
    loadSettings()
    loadFeeds()
    loadSuggestions()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await api.get('/settings')
      setSettings(data)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadFeeds = async () => {
    try {
      const data = await api.get('/feeds')
      setFeeds(data.feeds || [])
    } catch (err) {
      console.error('Failed to load feeds:', err)
    }
  }

  const loadSuggestions = async () => {
    try {
      const data = await api.get('/feeds/suggestions')
      setSuggestions(data.suggestions || [])
    } catch (err) {
      console.error('Failed to load suggestions:', err)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.put('/settings', settings)
      setMessage({ type: 'success', text: 'Settings saved!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = async () => {
    if (!confirm('Reset all settings to defaults?')) return
    try {
      const data = await api.post('/settings/reset')
      setSettings(data.settings)
      setMessage({ type: 'success', text: 'Settings reset to defaults' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reset settings' })
    }
  }

  const addFeed = async (url, name, genre) => {
    setAddingFeed(true)
    try {
      await api.post('/feeds', {
        feed_url: url,
        feed_name: name || undefined,
        genre_tag: genre || undefined
      })
      setNewFeedUrl('')
      setNewFeedName('')
      setNewFeedGenre('')
      loadFeeds()
      setMessage({ type: 'success', text: 'Feed added!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add feed' })
    } finally {
      setAddingFeed(false)
    }
  }

  // FIX: Use suggestion.url (not suggestion.feed_url)
  const addSuggestion = (suggestion) => {
    addFeed(suggestion.url, suggestion.name, suggestion.genre)
  }

  const removeFeed = async (feedId) => {
    if (!confirm('Remove this feed?')) return
    try {
      await api.delete(`/feeds/${feedId}`)
      loadFeeds()
      setMessage({ type: 'success', text: 'Feed removed' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to remove feed' })
    }
  }

  const toggleFeed = async (feed) => {
    try {
      await api.put(`/feeds/${feed.id}`, { enabled: !feed.enabled })
      loadFeeds()
    } catch (err) {
      console.error('Failed to toggle feed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-mosh-accent animate-spin" />
      </div>
    )
  }

  const tabs = [
    { id: 'playback', label: 'Playback', icon: Music },
    { id: 'feeds', label: 'News Feeds', icon: Rss },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-mosh-accent" />
        <h1 className="text-3xl font-bold text-mosh-light">Settings</h1>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-mosh-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-mosh-accent border-mosh-accent'
                : 'text-mosh-muted border-transparent hover:text-mosh-light'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Playback Tab */}
      {activeTab === 'playback' && settings && (
        <div className="space-y-6">
          {/* Playback Quality */}
          <div className="bg-mosh-dark rounded-xl p-6">
            <h3 className="text-lg font-semibold text-mosh-light mb-4">Playback Quality</h3>
            <div className="space-y-3">
              {['low', 'high', 'original'].map(quality => (
                <label key={quality} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="quality"
                    checked={settings.playback_quality === quality}
                    onChange={() => setSettings({ ...settings, playback_quality: quality })}
                    className="w-4 h-4 text-mosh-accent bg-mosh-darker border-mosh-border focus:ring-mosh-accent"
                  />
                  <div>
                    <span className="text-mosh-light capitalize">{quality}</span>
                    <span className="text-mosh-muted text-sm ml-2">
                      {quality === 'low' && '(Data saver - 128kbps)'}
                      {quality === 'high' && '(Balanced - 256kbps)'}
                      {quality === 'original' && '(Best quality - Original file)'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Crossfade */}
          <div className="bg-mosh-dark rounded-xl p-6">
            <h3 className="text-lg font-semibold text-mosh-light mb-4">Crossfade</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="12"
                value={settings.crossfade_seconds}
                onChange={(e) => setSettings({ ...settings, crossfade_seconds: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-mosh-darker rounded-lg appearance-none cursor-pointer accent-mosh-accent"
              />
              <span className="text-mosh-light w-16 text-right">
                {settings.crossfade_seconds === 0 ? 'Off' : `${settings.crossfade_seconds}s`}
              </span>
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-mosh-dark rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-mosh-light mb-4">Playback Options</h3>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-mosh-light">Gapless Playback</span>
                <p className="text-mosh-muted text-sm">Seamless transitions between tracks</p>
              </div>
              <input
                type="checkbox"
                checked={settings.gapless_enabled}
                onChange={(e) => setSettings({ ...settings, gapless_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-mosh-accent bg-mosh-darker border-mosh-border focus:ring-mosh-accent cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-mosh-light">Volume Normalization</span>
                <p className="text-mosh-muted text-sm">Keep volume consistent across tracks</p>
              </div>
              <input
                type="checkbox"
                checked={settings.normalize_volume}
                onChange={(e) => setSettings({ ...settings, normalize_volume: e.target.checked })}
                className="w-5 h-5 rounded text-mosh-accent bg-mosh-darker border-mosh-border focus:ring-mosh-accent cursor-pointer"
              />
            </label>
          </div>

          {/* Cache Limit */}
          <div className="bg-mosh-dark rounded-xl p-6">
            <h3 className="text-lg font-semibold text-mosh-light mb-4">Cache Limit</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={settings.cache_limit_mb}
                onChange={(e) => setSettings({ ...settings, cache_limit_mb: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-mosh-darker rounded-lg appearance-none cursor-pointer accent-mosh-accent"
              />
              <span className="text-mosh-light w-20 text-right">
                {settings.cache_limit_mb >= 1000 
                  ? `${(settings.cache_limit_mb / 1000).toFixed(1)} GB`
                  : `${settings.cache_limit_mb} MB`
                }
              </span>
            </div>
          </div>

          {/* Save/Reset Buttons */}
          <div className="flex gap-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-mosh-accent hover:bg-mosh-accent/80 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
            <button
              onClick={resetSettings}
              className="flex items-center gap-2 px-6 py-3 bg-mosh-hover hover:bg-mosh-border text-mosh-light font-semibold rounded-lg transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* Feeds Tab */}
      {activeTab === 'feeds' && (
        <div className="space-y-6">
          {/* Add Feed Form */}
          <div className="bg-mosh-dark rounded-xl p-6">
            <h3 className="text-lg font-semibold text-mosh-light mb-4">Add RSS Feed</h3>
            <div className="space-y-4">
              <input
                type="url"
                placeholder="Feed URL (e.g., https://pitchfork.com/feed/...)"
                value={newFeedUrl}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                className="w-full px-4 py-3 bg-mosh-darker border border-mosh-border rounded-lg text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent"
              />
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Feed name (optional)"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  className="flex-1 px-4 py-3 bg-mosh-darker border border-mosh-border rounded-lg text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent"
                />
                <input
                  type="text"
                  placeholder="Genre (optional)"
                  value={newFeedGenre}
                  onChange={(e) => setNewFeedGenre(e.target.value)}
                  className="w-40 px-4 py-3 bg-mosh-darker border border-mosh-border rounded-lg text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent"
                />
                <button
                  onClick={() => addFeed(newFeedUrl, newFeedName, newFeedGenre)}
                  disabled={!newFeedUrl || addingFeed}
                  className="flex items-center gap-2 px-6 py-3 bg-mosh-accent hover:bg-mosh-accent/80 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {addingFeed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-mosh-dark rounded-xl p-6">
              <h3 className="text-lg font-semibold text-mosh-light mb-4">Suggested Feeds</h3>
              <div className="grid grid-cols-2 gap-3">
                {suggestions.map((suggestion, idx) => {
                  // FIX: Check suggestion.url (not suggestion.feed_url)
                  const alreadyAdded = feeds.some(f => f.feed_url === suggestion.url)
                  return (
                    <button
                      key={idx}
                      onClick={() => !alreadyAdded && addSuggestion(suggestion)}
                      disabled={alreadyAdded}
                      className={`flex items-center justify-between p-3 rounded-lg transition ${
                        alreadyAdded
                          ? 'bg-mosh-hover/50 text-mosh-muted cursor-not-allowed'
                          : 'bg-mosh-hover hover:bg-mosh-border text-mosh-light'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-medium">{suggestion.name}</div>
                        <div className="text-sm text-mosh-muted">{suggestion.genre}</div>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-xs text-mosh-muted">Added</span>
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Your Feeds */}
          <div className="bg-mosh-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-mosh-light">Your Feeds ({feeds.length}/20)</h3>
              <button
                onClick={loadFeeds}
                className="flex items-center gap-2 text-mosh-muted hover:text-mosh-light transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
            
            {feeds.length === 0 ? (
              <p className="text-mosh-muted text-center py-8">
                No feeds added yet. Add some from the suggestions above!
              </p>
            ) : (
              <div className="space-y-3">
                {feeds.map(feed => (
                  <div
                    key={feed.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      feed.enabled ? 'bg-mosh-hover' : 'bg-mosh-darker opacity-60'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-mosh-light font-medium">
                          {feed.feed_name || 'Unnamed Feed'}
                        </span>
                        {feed.genre_tag && (
                          <span className="text-xs px-2 py-0.5 bg-mosh-accent/20 text-mosh-accent rounded">
                            {feed.genre_tag}
                          </span>
                        )}
                        {feed.fetch_error && (
                          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                            Error
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-mosh-muted truncate max-w-md">
                        {feed.feed_url}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feed.enabled}
                          onChange={() => toggleFeed(feed)}
                          className="w-4 h-4 rounded text-mosh-accent bg-mosh-darker border-mosh-border focus:ring-mosh-accent cursor-pointer"
                        />
                      </label>
                      <button
                        onClick={() => removeFeed(feed.id)}
                        className="p-2 text-mosh-muted hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feed Settings */}
          {settings && (
            <div className="bg-mosh-dark rounded-xl p-6">
              <h3 className="text-lg font-semibold text-mosh-light mb-4">Feed Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-mosh-light mb-2">Refresh Interval</label>
                  <select
                    value={settings.rss_refresh_minutes}
                    onChange={(e) => setSettings({ ...settings, rss_refresh_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-mosh-darker border border-mosh-border rounded-lg text-mosh-light focus:outline-none focus:border-mosh-accent"
                  >
                    <option value={15}>Every 15 minutes</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every hour</option>
                    <option value={360}>Every 6 hours</option>
                    <option value={1440}>Once a day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-mosh-light mb-2">Max Articles</label>
                  <select
                    value={settings.rss_max_articles}
                    onChange={(e) => setSettings({ ...settings, rss_max_articles: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-mosh-darker border border-mosh-border rounded-lg text-mosh-light focus:outline-none focus:border-mosh-accent"
                  >
                    <option value={10}>10 articles</option>
                    <option value={25}>25 articles</option>
                    <option value={50}>50 articles</option>
                    <option value={100}>100 articles</option>
                  </select>
                </div>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-mosh-accent hover:bg-mosh-accent/80 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Feed Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
