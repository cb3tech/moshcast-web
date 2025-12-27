import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Radio, Users, Clock, UserPlus, Loader2, Check, Tv } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useFriends } from '../context/FriendsContext'
import { usePullToRefresh, PullIndicator } from '../hooks/usePullToRefresh'

const API_URL = import.meta.env.VITE_API_URL || 'https://moshcast-production.up.railway.app'

export default function LiveStreams() {
  const { user } = useAuth()
  const { friends = [], pendingSent = [], sendFriendRequest } = useFriends()
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendingRequest, setSendingRequest] = useState(null)

  const fetchStreams = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/streams/active`)
      if (res.ok) {
        const data = await res.json()
        setStreams(data.streams || [])
      }
    } catch (err) {
      console.error('Failed to fetch streams:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Pull-to-refresh hook
  const { isRefreshing, pullProgress, handlers } = usePullToRefresh(fetchStreams)

  useEffect(() => {
    fetchStreams()
    const interval = setInterval(fetchStreams, 10000)
    return () => clearInterval(interval)
  }, [fetchStreams])

  const isFriend = (hostUsername) => {
    return friends.some(f => f.username === hostUsername)
  }

  const isPending = (hostUsername) => {
    return pendingSent.some(p => p.username === hostUsername)
  }

  const handleSendRequest = async (hostUsername) => {
    setSendingRequest(hostUsername)
    try {
      await sendFriendRequest(hostUsername)
    } finally {
      setSendingRequest(null)
    }
  }

  const formatElapsed = (startedAt) => {
    const seconds = Math.floor((Date.now() - new Date(startedAt)) / 1000)
    const mins = Math.floor(seconds / 60)
    const hrs = Math.floor(mins / 60)
    if (hrs > 0) return `${hrs}h ${mins % 60}m`
    return `${mins}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 pt-52">
        <Loader2 className="w-8 h-8 text-mosh-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 pt-52 max-w-6xl mx-auto" {...handlers}>
      {/* Pull-to-refresh indicator */}
      <PullIndicator progress={pullProgress} isRefreshing={isRefreshing} />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-mosh-light">Live Streams</h1>
          <p className="text-mosh-muted mt-1 text-sm md:text-base">Discover what your friends are playing</p>
        </div>
        <Link
          to="/live"
          className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 md:py-2 rounded-lg transition-colors min-h-[44px]"
        >
          <Radio className="w-4 h-4" />
          <span>Start Streaming</span>
        </Link>
      </div>

      {/* Info box */}
      <div className="bg-mosh-dark/50 border border-mosh-border rounded-lg p-4 mb-6">
        <p className="text-mosh-muted text-sm">
          <span className="text-mosh-light font-medium">Private sharing:</span> You can only join streams from friends. 
          Send a friend request to connect with other listeners.
        </p>
      </div>

      {streams.length === 0 ? (
        <div className="text-center py-12 md:py-16">
          <Tv className="w-12 h-12 md:w-16 md:h-16 text-mosh-muted mx-auto mb-4" />
          <h2 className="text-lg md:text-xl font-medium text-mosh-light mb-2">No live streams right now</h2>
          <p className="text-mosh-muted mb-6 text-sm md:text-base">Be the first to go live!</p>
          <Link
            to="/live"
            className="inline-flex items-center gap-2 bg-mosh-accent hover:bg-mosh-accent/80 text-black px-6 py-3 rounded-lg transition-colors min-h-[44px]"
          >
            <Radio className="w-4 h-4" />
            Start Streaming
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map((stream) => {
            const canJoin = isFriend(stream.hostUsername)
            const pending = isPending(stream.hostUsername)
            const isMe = user?.username === stream.hostUsername

            return (
              <div
                key={stream.hostUsername}
                className="bg-mosh-dark border border-mosh-border rounded-lg p-4 hover:border-mosh-accent/50 transition-colors"
              >
                {/* Live indicator */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                  <span className="text-mosh-muted text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatElapsed(stream.startedAt)}
                  </span>
                </div>

                {/* Host */}
                <h3 className="text-lg font-semibold text-mosh-light mb-1">
                  @{stream.hostUsername}
                  {isMe && <span className="text-mosh-accent text-sm ml-2">(You)</span>}
                </h3>

                {/* Current song */}
                {stream.currentSong ? (
                  <p className="text-mosh-muted text-sm mb-3 truncate">
                    🎵 {stream.currentSong.title} - {stream.currentSong.artist}
                  </p>
                ) : (
                  <p className="text-mosh-muted text-sm mb-3 italic">No song playing</p>
                )}

                {/* Listeners */}
                <div className="flex items-center gap-1 text-mosh-muted text-sm mb-4">
                  <Users className="w-4 h-4" />
                  <span>{stream.listenerCount} listening</span>
                </div>

                {/* Action button - larger touch target on mobile */}
                {isMe ? (
                  <Link
                    to="/live"
                    className="w-full flex items-center justify-center gap-2 bg-mosh-accent text-black py-3 rounded-lg font-medium hover:bg-mosh-accent/80 transition-colors min-h-[44px]"
                  >
                    Manage Stream
                  </Link>
                ) : canJoin ? (
                  <Link
                    to={`/join/${stream.hostUsername}`}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors min-h-[44px]"
                  >
                    Join Stream
                  </Link>
                ) : pending ? (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 bg-mosh-border text-mosh-muted py-3 rounded-lg font-medium cursor-not-allowed min-h-[44px]"
                  >
                    <Check className="w-4 h-4" />
                    Request Pending
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendRequest(stream.hostUsername)}
                    disabled={sendingRequest === stream.hostUsername}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {sendingRequest === stream.hostUsername ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Send Friend Request
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
