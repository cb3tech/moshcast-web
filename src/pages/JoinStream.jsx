import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { 
  Play, Pause, Radio, Users, Volume2, VolumeX, ArrowLeft,
  Send, MessageCircle, Wifi, WifiOff
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://moshcast-production.up.railway.app'

export default function JoinStream() {
  const { username } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [hasJoined, setHasJoined] = useState(false)
  const [connected, setConnected] = useState(false)
  const [listenerCount, setListenerCount] = useState(0)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [listenerName, setListenerName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(true)
  const [audioReady, setAudioReady] = useState(false)
  
  const audioRef = useRef(null)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const pendingStateRef = useRef(null)

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize Socket.IO connection
  useEffect(() => {
    socketRef.current = io(API_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    })

    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connected')
      setConnected(true)
      setLoading(false)
    })

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
      setConnected(false)
    })

    socketRef.current.on('stream:error', ({ error, code }) => {
      console.log('❌ Stream error:', error)
      setError(error)
      setLoading(false)
    })

    socketRef.current.on('stream:state', (state) => {
      console.log('📡 Received stream state:', state)
      setSession(state)
      setListenerCount(state.listenerCount || 0)
      setLoading(false)
      
      // Store state for when audio is ready
      pendingStateRef.current = state
      
      // Try to sync if audio ready
      if (audioReady && audioRef.current) {
        syncAudio(state)
      }
    })

    socketRef.current.on('stream:update', (update) => {
      console.log('📡 Stream update:', update)
      setSession(prev => ({
        ...prev,
        ...update
      }))
      
      // Store for sync
      pendingStateRef.current = update
      
      // Sync audio if ready
      if (audioReady && audioRef.current) {
        syncAudio(update)
      }
    })

    socketRef.current.on('stream:listeners', ({ count }) => {
      setListenerCount(count)
    })

    socketRef.current.on('stream:ended', ({ message }) => {
      setError(message || 'Stream ended')
      setSession(null)
      if (audioRef.current) {
        audioRef.current.pause()
      }
    })

    socketRef.current.on('chat:message', (msg) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: msg.type,
        username: msg.username,
        text: msg.text,
        timestamp: new Date(msg.timestamp),
        isOwn: msg.senderId === socketRef.current?.id
      }])
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [audioReady])

  // Sync audio with stream state
  const syncAudio = (state) => {
    const audio = audioRef.current
    if (!audio) return

    console.log('🔊 Syncing audio:', state)

    // If song changed, load new song
    if (state.song?.file_url) {
      const currentSrc = audio.src || ''
      const newSrc = state.song.file_url
      
      // Check if different song (compare without query params)
      if (!currentSrc.includes(newSrc.split('?')[0])) {
        console.log('🎵 Loading new song:', newSrc)
        audio.src = newSrc
        audio.load()
      }
    }

    // Sync position (if drift > 2 seconds)
    if (state.position !== undefined && !isNaN(state.position)) {
      const drift = Math.abs(audio.currentTime - state.position)
      if (drift > 2) {
        console.log(`⏱️ Correcting drift: ${drift.toFixed(1)}s`)
        audio.currentTime = state.position
      }
    }

    // Sync play/pause
    if (state.isPlaying === true && audio.paused) {
      console.log('▶️ Starting playback')
      audio.play().then(() => {
        setIsPlaying(true)
      }).catch(err => {
        console.error('Autoplay failed:', err)
        // User will need to click play manually
      })
    } else if (state.isPlaying === false && !audio.paused) {
      console.log('⏸️ Pausing playback')
      audio.pause()
      setIsPlaying(false)
    }
  }

  // Join stream with name
  const handleJoin = () => {
    if (!listenerName.trim()) {
      setListenerName('Anonymous')
    }
    
    setShowNamePrompt(false)
    setHasJoined(true)

    // Join via WebSocket
    socketRef.current.emit('listener:join', {
      username: username,
      listenerName: listenerName.trim() || 'Anonymous'
    })
  }

  // Handle audio ready
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !hasJoined) return

    const handleCanPlay = () => {
      console.log('🔊 Audio can play')
      setAudioReady(true)
      
      // Sync with pending state
      if (pendingStateRef.current) {
        syncAudio(pendingStateRef.current)
      }
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleError = (e) => console.error('Audio error:', e)

    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
    }
  }, [hasJoined])

  // Manual play button for when autoplay fails
  const handleManualPlay = () => {
    const audio = audioRef.current
    if (!audio) return

    // Set source if we have it
    if (session?.song?.file_url && !audio.src) {
      audio.src = session.song.file_url
      audio.load()
    }

    // Set position
    if (session?.position) {
      audio.currentTime = session.position
    }

    // Play
    audio.play().then(() => {
      setIsPlaying(true)
      setAudioReady(true)
    }).catch(console.error)
  }

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  // Send chat message
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socketRef.current) return

    socketRef.current.emit('chat:send', {
      username: username,
      message: newMessage.trim(),
      senderName: listenerName || 'Anonymous'
    })

    setNewMessage('')
  }

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Radio className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400">Connecting to stream...</p>
        </div>
      </div>
    )
  }

  // Error state (no stream)
  if (error || (!session && !showNamePrompt && hasJoined)) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Radio className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Stream Offline</h1>
          <p className="text-zinc-400 mb-6">
            {error || `${username.toUpperCase()} isn't live right now. Check back later!`}
          </p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Moshcast
          </Link>
        </div>
      </div>
    )
  }

  // Name prompt
  if (showNamePrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-zinc-900 flex items-center justify-center p-4">
        <div className="bg-zinc-800/80 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Radio className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Join {username.toUpperCase()}'s Stream
            </h1>
            <p className="text-zinc-400">Enter your name to join the listening party</p>
          </div>

          <input
            type="text"
            value={listenerName}
            onChange={(e) => setListenerName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500 mb-4"
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            autoFocus
          />

          <button
            onClick={handleJoin}
            disabled={!connected}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            {connected ? (
              <>
                <Play className="w-5 h-5" fill="white" />
                Join Stream
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5" />
                Connecting...
              </>
            )}
          </button>

          <p className="text-center text-zinc-500 text-sm mt-4">
            {connected ? (
              <span className="flex items-center justify-center gap-1">
                <Wifi className="w-3 h-3 text-green-500" />
                Connected to server
              </span>
            ) : (
              'Establishing connection...'
            )}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-zinc-900 flex flex-col">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />

      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Link to="/" className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm">{listenerCount}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-medium">LIVE</span>
          </div>
        </div>
        <div className="w-5" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 md:p-6">
        {/* Left: Player */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Album art */}
          <div className="relative mb-6">
            {session?.song?.artwork_url ? (
              <img 
                src={session.song.artwork_url} 
                alt="Album art"
                className="w-56 h-56 md:w-72 md:h-72 rounded-2xl shadow-2xl object-cover"
              />
            ) : (
              <div className="w-56 h-56 md:w-72 md:h-72 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <Radio className="w-20 h-20 text-zinc-600" />
              </div>
            )}
            
            {/* Animated rings when playing */}
            {isPlaying && (
              <>
                <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/50 animate-ping" />
                <div className="absolute inset-0 rounded-2xl border border-purple-500/30 animate-pulse" />
              </>
            )}
          </div>

          {/* Song info */}
          <div className="text-center mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
              {session?.song?.title || 'Waiting for host...'}
            </h1>
            <p className="text-zinc-400">
              {session?.song?.artist || 'No song playing'}
            </p>
          </div>

          {/* Host info */}
          <div className="flex items-center gap-2 mb-6 text-zinc-400">
            <span>Listening with <span className="text-white font-medium">{username.toUpperCase()}</span></span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            {/* Play/Sync button */}
            {!isPlaying && session?.song?.file_url && (
              <button
                onClick={handleManualPlay}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-full transition"
              >
                <Play className="w-5 h-5" fill="white" />
                Start Listening
              </button>
            )}

            {/* Play state indicator */}
            {isPlaying && (
              <div className="flex items-center gap-2 text-white">
                <div className="flex gap-1">
                  <span className="w-1 h-4 bg-purple-500 rounded animate-pulse" />
                  <span className="w-1 h-4 bg-purple-500 rounded animate-pulse delay-75" />
                  <span className="w-1 h-4 bg-purple-500 rounded animate-pulse delay-150" />
                </div>
                <span className="text-sm">Playing</span>
              </div>
            )}

            {/* Time */}
            <span className="text-zinc-400 text-sm font-mono">
              {formatTime(currentTime)}
            </span>

            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Right: Chat */}
        <div className="w-full md:w-80 flex flex-col bg-zinc-800/50 rounded-xl overflow-hidden backdrop-blur-sm">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-zinc-700 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-white">Chat</span>
            <span className="ml-auto text-xs text-zinc-500">{listenerCount} listening</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64 md:max-h-none">
            {messages.length === 0 ? (
              <div className="text-center text-zinc-500 text-sm py-4">
                Say hi to the group! 👋
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id}>
                  {msg.type === 'system' ? (
                    <div className="text-center text-xs text-zinc-500 py-1">
                      {msg.text}
                    </div>
                  ) : (
                    <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-zinc-500 mb-1">
                        {msg.username}
                      </span>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        msg.isOwn 
                          ? 'bg-purple-600 text-white rounded-br-md' 
                          : 'bg-zinc-700 text-white rounded-bl-md'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-full text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-full transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-zinc-600 text-sm">
          Powered by <span className="text-purple-400">Moshcast</span>
        </p>
      </footer>
    </div>
  )
}
