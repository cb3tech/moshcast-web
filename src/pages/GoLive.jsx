import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import { 
  Radio, Users, Send, Music, Play, Pause, 
  MicOff, Copy, Check,
  MessageCircle, Link, Lock, UserPlus, Smartphone,
  Wifi, WifiOff
} from 'lucide-react'

const MAX_LISTENERS = 50
const API_URL = import.meta.env.VITE_API_URL || 'https://moshcast-production.up.railway.app'

export default function GoLive() {
  const { user, token } = useAuth()
  const { currentSong, isPlaying, togglePlay, progress } = usePlayer()
  const [isLive, setIsLive] = useState(false)
  const [listeners, setListeners] = useState(0)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [sessionCode, setSessionCode] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)
  const lastSongIdRef = useRef(null)
  const lastUpdateRef = useRef(0)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize Socket.IO connection
  useEffect(() => {
    socketRef.current = io(API_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    })

    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connected')
      setConnected(true)
    })

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
      setConnected(false)
    })

    socketRef.current.on('host:started', () => {
      console.log('🎙️ Session started successfully')
    })

    socketRef.current.on('stream:listeners', ({ count }) => {
      setListeners(count)
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
  }, [])

  // Send updates to listeners when playing state changes
  useEffect(() => {
    if (!isLive || !socketRef.current || !user) return

    // Throttle updates to every 500ms
    const now = Date.now()
    if (now - lastUpdateRef.current < 500) return
    lastUpdateRef.current = now

    // Check if song changed
    const songChanged = currentSong?.id !== lastSongIdRef.current
    if (songChanged) {
      lastSongIdRef.current = currentSong?.id
    }

    socketRef.current.emit('host:update', {
      username: user.username,
      song: songChanged ? {
        id: currentSong?.id,
        title: currentSong?.title,
        artist: currentSong?.artist,
        file_url: currentSong?.file_url,
        artwork_url: currentSong?.artwork_url
      } : undefined,
      position: progress,
      isPlaying: isPlaying
    })
  }, [isLive, currentSong, isPlaying, progress, user])

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getSessionCode = () => {
    return user?.username?.toUpperCase() || 'LIVE'
  }

  const handleGoLive = () => {
    if (!currentSong) {
      alert('Select a song to play before going live!')
      return
    }
    
    if (!socketRef.current?.connected) {
      alert('Not connected to server. Please wait...')
      return
    }

    // Start session via WebSocket
    socketRef.current.emit('host:start', {
      username: user.username,
      song: {
        id: currentSong.id,
        title: currentSong.title,
        artist: currentSong.artist,
        file_url: currentSong.file_url,
        artwork_url: currentSong.artwork_url
      }
    })

    const code = getSessionCode()
    setSessionCode(code)
    lastSongIdRef.current = currentSong.id
    setIsLive(true)
    setListeners(0)
    
    setMessages([{
      id: Date.now(),
      type: 'system',
      text: 'Session started! Share your invite link with friends.',
      timestamp: new Date()
    }])
  }

  const handleEndBroadcast = () => {
    if (socketRef.current) {
      socketRef.current.emit('host:end', { username: user.username })
    }

    setIsLive(false)
    setListeners(0)
    setSessionCode('')
    lastSongIdRef.current = null
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      text: 'Session ended',
      timestamp: new Date()
    }])
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socketRef.current) return

    socketRef.current.emit('chat:send', {
      username: user.username,
      message: newMessage.trim(),
      senderName: user.username
    })

    setNewMessage('')
  }

  const getInviteLink = () => {
    return `${window.location.origin}/join/${sessionCode}`
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(getInviteLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareToSocial = (platform) => {
    const link = getInviteLink()
    const text = `🎵 Join my private listening session on Moshcast!`
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      sms: `sms:?&body=${encodeURIComponent(`${text} ${link}`)}`,
    }
    
    if (platform === 'sms') {
      window.location.href = urls.sms
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="p-6 pt-52 h-full flex flex-col pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-mosh-card'}`}>
            <Radio className={`w-6 h-6 ${isLive ? 'text-white' : 'text-mosh-accent'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-mosh-light">Go Live</h1>
            <p className="text-sm text-mosh-muted">Private listening sessions with friends</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Connected' : 'Connecting...'}
          </div>

          {isLive && (
            <>
              <div className="flex items-center gap-2 text-mosh-light">
                <Users className="w-5 h-5 text-mosh-accent" />
                <span className="font-medium">{listeners}</span>
                <span className="text-mosh-muted">/ {MAX_LISTENERS}</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-red-500/20 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-sm font-medium">LIVE</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: Broadcast Controls */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Private Session Notice */}
          <div className="bg-mosh-accent/10 border border-mosh-accent/30 rounded-xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-mosh-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-mosh-light font-medium">Private Sessions Only</p>
              <p className="text-xs text-mosh-muted mt-1">
                Sessions are invite-only and limited to {MAX_LISTENERS} friends. 
                Share your invite link to let friends join and listen along with you in real-time.
              </p>
            </div>
          </div>

          {/* Now Playing Card */}
          <div className="bg-mosh-card rounded-xl p-6">
            <h2 className="text-sm font-medium text-mosh-muted mb-4">NOW PLAYING</h2>
            
            {currentSong ? (
              <div className="flex items-center gap-4">
                {currentSong.artwork_url ? (
                  <img 
                    src={currentSong.artwork_url} 
                    alt="Album art"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-mosh-dark rounded-lg flex items-center justify-center">
                    <Music className="w-8 h-8 text-mosh-muted" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-mosh-light">{currentSong.title}</h3>
                  <p className="text-mosh-muted">{currentSong.artist}</p>
                </div>
                <button
                  onClick={togglePlay}
                  className="p-4 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black rounded-full transition"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-mosh-muted">
                <p>Select a song from your library to start</p>
              </div>
            )}
          </div>

          {/* Broadcast Button */}
          {!isLive ? (
            <button
              onClick={handleGoLive}
              disabled={!currentSong || !connected}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition flex items-center justify-center gap-3"
            >
              <Radio className="w-6 h-6" />
              Start Private Session
            </button>
          ) : (
            <button
              onClick={handleEndBroadcast}
              className="w-full py-4 bg-mosh-card hover:bg-mosh-hover border border-red-500/50 text-red-400 font-bold text-lg rounded-xl transition flex items-center justify-center gap-3"
            >
              <MicOff className="w-6 h-6" />
              End Session
            </button>
          )}

          {/* Invite Friends (when live) */}
          {isLive && (
            <div className="bg-mosh-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="w-5 h-5 text-mosh-accent" />
                <h3 className="text-sm font-medium text-mosh-light">Invite Friends</h3>
              </div>
              
              {/* Invite Link */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-mosh-dark rounded-lg">
                  <Link className="w-4 h-4 text-mosh-muted" />
                  <code className="text-sm text-mosh-light truncate">{getInviteLink()}</code>
                </div>
                <button
                  onClick={copyInviteLink}
                  className="px-4 py-2 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-medium rounded-lg transition flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Social Share */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-mosh-muted">Share via:</span>
                {isMobile && (
                  <button
                    onClick={() => shareToSocial('sms')}
                    className="p-2 bg-mosh-dark hover:bg-mosh-hover rounded-lg transition"
                    title="Share via SMS"
                  >
                    <Smartphone className="w-4 h-4 text-mosh-light" />
                  </button>
                )}
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="p-2 bg-mosh-dark hover:bg-mosh-hover rounded-lg transition"
                  title="Share to X"
                >
                  <svg className="w-4 h-4 text-mosh-light" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="p-2 bg-mosh-dark hover:bg-mosh-hover rounded-lg transition"
                  title="Share to Facebook"
                >
                  <svg className="w-4 h-4 text-mosh-light" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* How it Works (when not live) */}
          {!isLive && (
            <div className="bg-mosh-card/50 rounded-xl p-4 border border-mosh-border">
              <h3 className="text-sm font-medium text-mosh-light mb-3">How it works</h3>
              <ol className="space-y-2 text-sm text-mosh-text">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-mosh-accent text-mosh-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Select a song or playlist from your library</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-mosh-accent text-mosh-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Click "Start Private Session" to begin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-mosh-accent text-mosh-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Share your invite link with up to {MAX_LISTENERS} friends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-mosh-accent text-mosh-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <span>Friends join and listen along in real-time</span>
                </li>
              </ol>
              
              <div className="mt-4 pt-4 border-t border-mosh-border">
                <p className="text-xs text-mosh-muted">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Sessions are private and require an invite link. For personal use with friends only.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="w-80 flex flex-col bg-mosh-card rounded-xl overflow-hidden">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-mosh-border flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-mosh-accent" />
            <span className="font-medium text-mosh-light">Session Chat</span>
            {isLive && (
              <span className="ml-auto text-xs text-mosh-muted">{listeners} listening</span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-mosh-muted text-sm py-8">
                {isLive ? 'Chat with your listeners!' : 'Start a session to chat'}
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id}>
                  {msg.type === 'system' ? (
                    <div className="text-center text-xs text-mosh-muted py-1">
                      {msg.text}
                    </div>
                  ) : (
                    <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-mosh-muted mb-1">
                        {msg.username}
                      </span>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        msg.isOwn 
                          ? 'bg-mosh-accent text-mosh-black rounded-br-md' 
                          : 'bg-mosh-dark text-mosh-light rounded-bl-md'
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
          <form onSubmit={handleSendMessage} className="p-3 border-t border-mosh-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isLive ? "Say something..." : "Start a session to chat"}
                disabled={!isLive}
                className="flex-1 px-3 py-2 bg-mosh-dark border border-mosh-border rounded-full text-sm text-mosh-light placeholder-mosh-muted focus:outline-none focus:border-mosh-accent disabled:opacity-50 transition"
              />
              <button
                type="submit"
                disabled={!isLive || !newMessage.trim()}
                className="p-2 bg-mosh-accent hover:bg-mosh-accent-hover disabled:bg-mosh-dark disabled:text-mosh-muted text-mosh-black rounded-full transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
