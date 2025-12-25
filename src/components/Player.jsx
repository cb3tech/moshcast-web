import { useState, useEffect, useRef } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { formatDuration } from '../utils/format'
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Shuffle, Repeat, Repeat1,
  Music, List
} from 'lucide-react'
import QueuePanel from './QueuePanel'

export default function Player() {
  const { 
    currentSong, isPlaying, progress, duration, volume,
    togglePlay, seek, setVolume, nextSong, prevSong,
    shuffle, toggleShuffle, repeat, toggleRepeat,
    queue, queueIndex, howlRef
  } = usePlayer()

  const [showVolume, setShowVolume] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const analyserRef = useRef(null)
  const audioContextRef = useRef(null)
  const sourceCreatedRef = useRef(new Set())

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey) {
            nextSong()
          } else {
            seek(Math.min(progress + 10, duration))
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey) {
            prevSong()
          } else {
            seek(Math.max(progress - 10, 0))
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(Math.min(volume + 0.1, 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(Math.max(volume - 0.1, 0))
          break
        case 'KeyM':
          e.preventDefault()
          setVolume(volume === 0 ? 0.7 : 0)
          break
        case 'KeyS':
          e.preventDefault()
          toggleShuffle()
          break
        case 'KeyR':
          e.preventDefault()
          toggleRepeat()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, seek, setVolume, nextSong, prevSong, progress, duration, volume, toggleShuffle, toggleRepeat])

  // Waveform visualizer
  useEffect(() => {
    if (!currentSong || !howlRef?.current?._sounds?.[0]?._node) return

    const audioNode = howlRef.current._sounds[0]._node
    const songId = currentSong.id

    // Only create audio context once
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }

    if (!analyserRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
    }

    // Create source only once per audio node
    if (!sourceCreatedRef.current.has(songId) && audioNode) {
      try {
        const source = audioContextRef.current.createMediaElementSource(audioNode)
        source.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)
        sourceCreatedRef.current.add(songId)
      } catch (e) {
        // Source might already be connected
      }
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8

        // Gradient from accent color
        ctx.fillStyle = `rgba(29, 185, 84, ${0.4 + (dataArray[i] / 255) * 0.6})`
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)

        x += barWidth + 1
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [currentSong?.id, howlRef])

  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-mosh-black to-mosh-darker border-t border-mosh-border flex items-center justify-center">
        <p className="text-mosh-muted text-sm">Select a song to start playing</p>
      </div>
    )
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-mosh-black to-mosh-darker border-t border-mosh-border">
        {/* Waveform Visualizer */}
        <canvas 
          ref={canvasRef}
          width={800}
          height={40}
          className="absolute top-0 left-0 right-0 w-full h-10 opacity-50"
        />

        <div className="relative h-full flex items-center px-4 gap-4">
          {/* Song Info */}
          <div className="flex items-center gap-3 w-72 min-w-0">
            <div className="w-14 h-14 bg-mosh-card rounded flex items-center justify-center flex-shrink-0">
              {currentSong.artwork_url ? (
                <img 
                  src={currentSong.artwork_url} 
                  alt={currentSong.album}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <Music className="w-6 h-6 text-mosh-muted" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-mosh-light truncate">
                {currentSong.title}
              </p>
              <p className="text-xs text-mosh-text truncate">
                {currentSong.artist || 'Unknown Artist'}
              </p>
            </div>
          </div>

          {/* Center Controls */}
          <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl mx-auto">
            {/* Buttons */}
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleShuffle}
                className={`p-1 transition ${shuffle ? 'text-mosh-accent' : 'text-mosh-muted hover:text-mosh-light'}`}
                title="Shuffle (S)"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              
              <button 
                onClick={prevSong}
                className="p-1 text-mosh-muted hover:text-mosh-light transition"
                title="Previous (Shift+←)"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="p-2 bg-mosh-light rounded-full hover:scale-105 transition"
                title="Play/Pause (Space)"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-mosh-black" />
                ) : (
                  <Play className="w-5 h-5 text-mosh-black ml-0.5" />
                )}
              </button>
              
              <button 
                onClick={nextSong}
                className="p-1 text-mosh-muted hover:text-mosh-light transition"
                title="Next (Shift+→)"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              
              <button 
                onClick={toggleRepeat}
                className={`p-1 transition ${repeat !== 'none' ? 'text-mosh-accent' : 'text-mosh-muted hover:text-mosh-light'}`}
                title="Repeat (R)"
              >
                {repeat === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full flex items-center gap-2">
              <span className="text-xs text-mosh-muted w-10 text-right">
                {formatDuration(progress)}
              </span>
              <div 
                className="flex-1 h-1 bg-mosh-card rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const percent = (e.clientX - rect.left) / rect.width
                  seek(percent * duration)
                }}
              >
                <div 
                  className="h-full bg-mosh-light group-hover:bg-mosh-accent rounded-full relative transition-colors"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-mosh-light rounded-full opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
              <span className="text-xs text-mosh-muted w-10">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 w-72 justify-end">
            {/* Queue Button */}
            <button 
              onClick={() => setShowQueue(!showQueue)}
              className={`p-2 transition ${showQueue ? 'text-mosh-accent' : 'text-mosh-muted hover:text-mosh-light'}`}
              title="Queue"
            >
              <List className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                className="p-1 text-mosh-muted hover:text-mosh-light transition"
                title="Mute (M)"
              >
                {volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <div 
                className="w-24 h-1 bg-mosh-card rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const percent = (e.clientX - rect.left) / rect.width
                  setVolume(Math.max(0, Math.min(1, percent)))
                }}
              >
                <div 
                  className="h-full bg-mosh-light group-hover:bg-mosh-accent rounded-full transition-colors"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      {showQueue && (
        <QueuePanel 
          queue={queue}
          currentIndex={queueIndex}
          onClose={() => setShowQueue(false)}
        />
      )}
    </>
  )
}
