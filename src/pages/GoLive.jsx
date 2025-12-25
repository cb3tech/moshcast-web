import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import { 
  Radio, Users, Send, Music, Play, Pause, 
  MicOff, Copy, Check,
  MessageCircle, Link, Lock, UserPlus, Smartphone
} from 'lucide-react'

const MAX_LISTENERS = 50

export default function GoLive() {
  const { user } = useAuth()
  const { currentSong, isPlaying, togglePlay } = usePlayer()
  const [isLive, setIsLive] = useState(false)
  const [listeners, setListeners] = useState(0)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [sessionCode, setSessionCode] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef(null)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Session code based on username (permanent link)
  const getSessionCode = () => {
    return user?.username?.toUpperCase() || 'LIVE'
  }

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simulated listeners (demo mode)
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setListeners(prev => {
          const change = Math.floor(Math.random() * 3) - 1
          return Math.max(1, Math.min(MAX_LISTENERS, prev + change))
        })
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [isLive])

  const handleGoLive = () => {
    if (!currentSong) {
      alert('Select a song to play before going live!')
      return
    }
    const code = getSessionCode()
    setSessionCode(code)
    setIsLive(true)
    setListeners(1)
    addSystemMessage(`Session started! Share your invite link with friends.`)
  }

  const handleEndBroadcast = () => {
    setIsLive(false)
    setListeners(0)
    setSessionCode('')
    addSystemMessage('Session ended')
  }

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      text,
      timestamp: new Date()
    }])
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      username: user?.username || 'You',
      text: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true
    }])
    setNewMessage('')

    // Simulate response (demo mode)
    if (isLive && Math.random() > 0.5) {
      setTimeout(() => {
        const responses = ['🔥', 'Great track!', 'Love this song', '👏', 'More like this!', 'What song is this?', 'Vibes ✨', '🎵']
        const names = ['MusicFan', 'Listener42', 'GrooveMaster', 'BeatLover', 'TunedIn']
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'user',
          username: names[Math.floor(Math.random() * names.length)],
          text: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date(),
          isOwn: false
        }])
      }, 2000 + Math.random() * 3000)
    }
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
    <div className="p-6 h-full flex flex-col pb-32">
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

        {isLive && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-mosh-light">
              <Users className="w-5 h-5 text-mosh-accent" />
              <span className="font-medium">{listeners}</span>
              <span className="text-mosh-muted">/ {MAX_LISTENERS}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-red-500/20 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-sm font-medium">LIVE</span>
            </div>
          </div>
        )}
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
                Share your invite link to let friends join and listen along with you.
              </p>
            </div>
          </div>

          {/* Now Playing Card */}
          <div className="bg-mosh-card rounded-xl p-6">
            <h2 className="text-sm font-medium text-mosh-muted mb-4">NOW PLAYING</h2>
            
            {currentSong ? (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-mosh-dark rounded-lg flex items-center justify-center flex-shrink-0">
                  {currentSong.artwork_url ? (
                    <img 
                      src={currentSong.artwork_url} 
                      alt={currentSong.album}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Music className="w-10 h-10 text-mosh-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-mosh-light truncate">
                    {currentSong.title}
                  </p>
                  <p className="text-mosh-text truncate">
                    {currentSong.artist || 'Unknown Artist'}
                  </p>
                  <p className="text-sm text-mosh-muted truncate">
                    {currentSong.album || 'Unknown Album'}
                  </p>
                </div>
                <button
                  onClick={togglePlay}
                  className="p-4 bg-mosh-accent hover:bg-mosh-accent-hover rounded-full transition"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-mosh-black" />
                  ) : (
                    <Play className="w-6 h-6 text-mosh-black ml-1" />
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-mosh-muted mx-auto mb-3" />
                <p className="text-mosh-text">Select a song from your library to start</p>
              </div>
            )}
          </div>

          {/* Broadcast Button */}
          {!isLive ? (
            <button
              onClick={handleGoLive}
              disabled={!currentSong}
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
                {/* SMS - Only show on mobile */}
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
                {isLive ? 'Chat with your friends!' : 'Start a session to chat'}
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
