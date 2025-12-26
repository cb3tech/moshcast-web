import { useState, useEffect, useRef } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { formatDuration } from '../utils/format'
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Shuffle, ListEnd,
  Music, List
} from 'lucide-react'
import QueuePanel from './QueuePanel'

export default function Player() {
  const { 
    currentSong, isPlaying, progress, duration, volume,
    togglePlay, seek, setVolume, nextSong, prevSong,
    shuffle, toggleShuffle, autoplay, toggleAutoplay,
    queue, queueIndex, analyserRef, audioContextRef
  } = usePlayer()

  const [showVolume, setShowVolume] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
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
        case 'KeyA':
          e.preventDefault()
          toggleAutoplay()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, seek, setVolume, nextSong, prevSong, progress, duration, volume, toggleShuffle, toggleAutoplay])

  // Real audio visualizer using Web Audio API analyser
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const barCount = 64
    const barWidth = (canvas.width / barCount) * 0.8
    const gap = (canvas.width / barCount) * 0.2
    
    // Store bar heights for smooth animation (used for both real and fake)
    const bars = Array(barCount).fill(0)
    const targetBars = Array(barCount).fill(0)
    
    // Check if we have a real analyser
    const analyser = analyserRef?.current
    const hasRealAnalyser = analyser && audioContextRef?.current
    
    // Create data array for frequency data
    const dataArray = hasRealAnalyser ? new Uint8Array(analyser.frequencyBinCount) : null

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (hasRealAnalyser && isPlaying) {
        // REAL VISUALIZER - Use actual frequency data
        analyser.getByteFrequencyData(dataArray)
        
        // Map frequency data to our bar count
        const step = Math.floor(dataArray.length / barCount)
        
        for (let i = 0; i < barCount; i++) {
          // Average a range of frequencies for each bar
          let sum = 0
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j]
          }
          const avg = sum / step
          
          // Scale to canvas height (0-255 -> 0-canvas.height)
          targetBars[i] = (avg / 255) * canvas.height * 0.85
          
          // Smooth interpolation
          bars[i] += (targetBars[i] - bars[i]) * 0.3
        }
      } else {
        // FAKE VISUALIZER - Animated bars when no analyser or paused
        for (let i = 0; i < barCount; i++) {
          if (isPlaying) {
            // Create wave-like pattern with some randomness
            const wave = Math.sin((Date.now() / 200) + (i * 0.3)) * 0.3 + 0.5
            const random = Math.random() * 0.4
            targetBars[i] = (wave + random) * canvas.height * 0.7
          } else {
            // Fade to small bars when paused
            targetBars[i] = 2
          }

          // Smooth interpolation
          bars[i] += (targetBars[i] - bars[i]) * 0.15
        }
      }

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap)
        const barHeight = Math.max(2, bars[i])

        // Gradient effect based on height
        const intensity = barHeight / (canvas.height * 0.85)
        
        // Use slightly different colors for real vs fake
        if (hasRealAnalyser && isPlaying) {
          // Real: More vibrant green
          ctx.fillStyle = `rgba(30, 215, 96, ${0.4 + intensity * 0.6})`
        } else {
          // Fake: Dimmer green
          ctx.fillStyle = `rgba(29, 185, 84, ${0.3 + intensity * 0.5})`
        }
        
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, analyserRef, audioContextRef])

  if (!currentSong) {
    return null // Don't show player if no song
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <>
      {/* Floating Player Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl">
        <div className="bg-mosh-darker/95 backdrop-blur-xl border border-mosh-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Audio Waveform Visualizer */}
          <canvas 
            ref={canvasRef}
            width={800}
            height={32}
            className="w-full h-8 opacity-60"
          />

          <div className="px-4 pb-4 pt-2">
            {/* Progress Bar - Full Width */}
            <div 
              className="w-full h-1.5 bg-mosh-card rounded-full cursor-pointer group mb-4"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const percent = (e.clientX - rect.left) / rect.width
                seek(percent * duration)
              }}
            >
              <div 
                className="h-full bg-mosh-accent rounded-full relative transition-colors"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-mosh-accent rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Song Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-mosh-card rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                  {currentSong.artwork_url ? (
                    <img 
                      src={currentSong.artwork_url} 
                      alt={currentSong.album}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Music className="w-5 h-5 text-mosh-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-mosh-light truncate">
                    {currentSong.title}
                  </p>
                  <p className="text-xs text-mosh-muted truncate">
                    {currentSong.artist || 'Unknown Artist'}
                  </p>
                </div>
                <div className="text-xs text-mosh-muted ml-2 flex-shrink-0">
                  {formatDuration(progress)} / {formatDuration(duration)}
                </div>
              </div>

              {/* Center Controls */}
              <div className="flex items-center gap-2">
                {/* Shuffle */}
                <button 
                  onClick={toggleShuffle}
                  className={`p-2 rounded-full transition ${shuffle ? 'bg-mosh-accent/20 text-mosh-accent' : 'text-mosh-muted hover:text-mosh-light hover:bg-mosh-card'}`}
                  title={`Shuffle ${shuffle ? 'ON' : 'OFF'} (S)`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                
                {/* Previous */}
                <button 
                  onClick={prevSong}
                  className="p-2 text-mosh-muted hover:text-mosh-light hover:bg-mosh-card rounded-full transition"
                  title="Previous (Shift+←)"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                
                {/* Play/Pause */}
                <button 
                  onClick={togglePlay}
                  className="p-3 bg-mosh-accent hover:bg-mosh-accent-hover rounded-full hover:scale-105 transition shadow-lg"
                  title="Play/Pause (Space)"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-mosh-black" />
                  ) : (
                    <Play className="w-6 h-6 text-mosh-black ml-0.5" />
                  )}
                </button>
                
                {/* Next */}
                <button 
                  onClick={nextSong}
                  className="p-2 text-mosh-muted hover:text-mosh-light hover:bg-mosh-card rounded-full transition"
                  title="Next (Shift+→)"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                
                {/* Autoplay */}
                <button 
                  onClick={toggleAutoplay}
                  className={`p-2 rounded-full transition ${autoplay ? 'bg-mosh-accent/20 text-mosh-accent' : 'text-mosh-muted hover:text-mosh-light hover:bg-mosh-card'}`}
                  title={`Autoplay ${autoplay ? 'ON' : 'OFF'} (A)`}
                >
                  <ListEnd className="w-4 h-4" />
                </button>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                    className="p-2 text-mosh-muted hover:text-mosh-light hover:bg-mosh-card rounded-full transition"
                    title="Mute (M)"
                  >
                    {volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <div 
                    className="w-20 h-1.5 bg-mosh-card rounded-full cursor-pointer group"
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

                {/* Queue Button */}
                <button 
                  onClick={() => setShowQueue(!showQueue)}
                  className={`p-2 rounded-full transition ${showQueue ? 'bg-mosh-accent/20 text-mosh-accent' : 'text-mosh-muted hover:text-mosh-light hover:bg-mosh-card'}`}
                  title="Queue"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Indicators */}
            {(shuffle || autoplay) && (
              <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-mosh-border/50">
                {shuffle && (
                  <span className="text-xs text-mosh-accent flex items-center gap-1">
                    <Shuffle className="w-3 h-3" /> Shuffle ON
                  </span>
                )}
                {autoplay && (
                  <span className="text-xs text-mosh-accent flex items-center gap-1">
                    <ListEnd className="w-3 h-3" /> Autoplay ON
                  </span>
                )}
              </div>
            )}
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
