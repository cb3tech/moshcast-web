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
  const [visualizerMode, setVisualizerMode] = useState(0) // 0-5 for different modes
  const peakHoldRef = useRef([]) // For peak hold mode

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

  // Visualizer mode names
  const visualizerModes = ['Bars', 'Mirrored', 'Circular', 'Waveform', 'Glow', 'Peak Hold']
  
  // Multi-mode audio visualizer using Web Audio API analyser
  // Modes: 0=Bars, 1=Mirrored, 2=Circular, 3=Waveform, 4=Glow Bars, 5=Peak Hold
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const barCount = 64
    
    // Store bar heights for smooth animation
    const bars = Array(barCount).fill(0)
    const targetBars = Array(barCount).fill(0)
    
    // Initialize peak hold array
    if (peakHoldRef.current.length !== barCount) {
      peakHoldRef.current = Array(barCount).fill(0)
    }
    const peakDecay = Array(barCount).fill(0) // Velocity for peak fall
    
    // Check if we have a real analyser
    const analyser = analyserRef?.current
    const hasRealAnalyser = analyser && audioContextRef?.current
    
    // Create data arrays for frequency and waveform data
    const frequencyData = hasRealAnalyser ? new Uint8Array(analyser.frequencyBinCount) : null
    const waveformData = hasRealAnalyser ? new Uint8Array(analyser.fftSize) : null

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Get audio data
      if (hasRealAnalyser && isPlaying) {
        analyser.getByteFrequencyData(frequencyData)
        if (visualizerMode === 3) {
          analyser.getByteTimeDomainData(waveformData)
        }
        
        const step = Math.floor(frequencyData.length / barCount)
        for (let i = 0; i < barCount; i++) {
          let sum = 0
          for (let j = 0; j < step; j++) {
            sum += frequencyData[i * step + j]
          }
          targetBars[i] = (sum / step / 255) * canvas.height * 0.9
          bars[i] += (targetBars[i] - bars[i]) * 0.3
        }
      } else {
        // Fake visualizer when paused or no analyser
        for (let i = 0; i < barCount; i++) {
          if (isPlaying) {
            const wave = Math.sin((Date.now() / 200) + (i * 0.3)) * 0.3 + 0.5
            const random = Math.random() * 0.4
            targetBars[i] = (wave + random) * canvas.height * 0.7
          } else {
            targetBars[i] = 2
          }
          bars[i] += (targetBars[i] - bars[i]) * 0.15
        }
      }

      const mode = visualizerMode
      const barWidth = (canvas.width / barCount) * 0.8
      const gap = (canvas.width / barCount) * 0.2
      const centerY = canvas.height / 2

      // MODE 0: Standard Bars
      if (mode === 0) {
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap)
          const barHeight = Math.max(2, bars[i])
          const intensity = barHeight / (canvas.height * 0.9)
          ctx.fillStyle = `rgba(30, 215, 96, ${0.4 + intensity * 0.6})`
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        }
      }
      
      // MODE 1: Mirrored Bars (from center)
      else if (mode === 1) {
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap)
          const barHeight = Math.max(2, bars[i] / 2)
          const intensity = barHeight / (canvas.height * 0.45)
          ctx.fillStyle = `rgba(30, 215, 96, ${0.4 + intensity * 0.6})`
          // Top half
          ctx.fillRect(x, centerY - barHeight, barWidth, barHeight)
          // Bottom half
          ctx.fillStyle = `rgba(30, 185, 96, ${0.3 + intensity * 0.5})`
          ctx.fillRect(x, centerY, barWidth, barHeight)
        }
      }
      
      // MODE 2: Circular
      else if (mode === 2) {
        const cx = canvas.width / 2
        const cy = canvas.height / 2
        const baseRadius = Math.min(cx, cy) * 0.3
        const maxRadius = Math.min(cx, cy) * 0.9
        
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2
          const barHeight = Math.max(4, bars[i] * 0.6)
          const intensity = barHeight / (canvas.height * 0.5)
          
          const x1 = cx + Math.cos(angle) * baseRadius
          const y1 = cy + Math.sin(angle) * baseRadius
          const x2 = cx + Math.cos(angle) * (baseRadius + barHeight)
          const y2 = cy + Math.sin(angle) * (baseRadius + barHeight)
          
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.strokeStyle = `rgba(30, 215, 96, ${0.5 + intensity * 0.5})`
          ctx.lineWidth = 3
          ctx.lineCap = 'round'
          ctx.stroke()
        }
        
        // Inner circle glow
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius)
        gradient.addColorStop(0, 'rgba(30, 215, 96, 0.1)')
        gradient.addColorStop(1, 'rgba(30, 215, 96, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // MODE 3: Waveform/Oscilloscope
      else if (mode === 3) {
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(30, 215, 96, 0.8)'
        ctx.lineWidth = 2
        
        if (hasRealAnalyser && isPlaying && waveformData) {
          const sliceWidth = canvas.width / waveformData.length
          let x = 0
          
          for (let i = 0; i < waveformData.length; i++) {
            const v = waveformData[i] / 128.0
            const y = (v * canvas.height) / 2
            
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
            x += sliceWidth
          }
        } else {
          // Fake waveform
          for (let x = 0; x < canvas.width; x += 2) {
            const wave = isPlaying 
              ? Math.sin((Date.now() / 100) + (x * 0.05)) * (20 + Math.random() * 15)
              : Math.sin(x * 0.05) * 2
            ctx.lineTo(x, centerY + wave)
          }
        }
        
        ctx.stroke()
        
        // Add glow effect
        ctx.shadowColor = 'rgba(30, 215, 96, 0.5)'
        ctx.shadowBlur = 10
        ctx.stroke()
        ctx.shadowBlur = 0
      }
      
      // MODE 4: Glow Bars
      else if (mode === 4) {
        ctx.shadowColor = 'rgba(30, 215, 96, 0.8)'
        ctx.shadowBlur = 15
        
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap)
          const barHeight = Math.max(2, bars[i])
          const intensity = barHeight / (canvas.height * 0.9)
          
          // Create gradient for each bar
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
          gradient.addColorStop(0, `rgba(30, 215, 96, ${0.6 + intensity * 0.4})`)
          gradient.addColorStop(0.5, `rgba(50, 235, 116, ${0.7 + intensity * 0.3})`)
          gradient.addColorStop(1, `rgba(100, 255, 150, ${0.8 + intensity * 0.2})`)
          
          ctx.fillStyle = gradient
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        }
        ctx.shadowBlur = 0
      }
      
      // MODE 5: Peak Hold
      else if (mode === 5) {
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap)
          const barHeight = Math.max(2, bars[i])
          const intensity = barHeight / (canvas.height * 0.9)
          
          // Update peak
          if (barHeight > peakHoldRef.current[i]) {
            peakHoldRef.current[i] = barHeight
            peakDecay[i] = 0
          } else {
            // Gravity-based fall
            peakDecay[i] += 0.2
            peakHoldRef.current[i] -= peakDecay[i]
            if (peakHoldRef.current[i] < barHeight) {
              peakHoldRef.current[i] = barHeight
            }
          }
          
          // Draw bar
          ctx.fillStyle = `rgba(30, 215, 96, ${0.4 + intensity * 0.5})`
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
          
          // Draw peak indicator
          const peakY = canvas.height - peakHoldRef.current[i]
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.fillRect(x, peakY - 2, barWidth, 2)
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, analyserRef, audioContextRef, visualizerMode])

  if (!currentSong) {
    return null // Don't show player if no song
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <>
      {/* Floating Player Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl">
        <div className="bg-mosh-darker/95 backdrop-blur-xl border border-mosh-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Audio Visualizer - Click to cycle modes */}
          <div className="relative group">
            <canvas 
              ref={canvasRef}
              width={800}
              height={80}
              className="w-full h-20 cursor-pointer"
              onClick={() => setVisualizerMode((visualizerMode + 1) % 6)}
              title={`Visualizer: ${visualizerModes[visualizerMode]} (click to change)`}
            />
            {/* Mode indicator */}
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-mosh-light opacity-0 group-hover:opacity-100 transition-opacity">
              {visualizerModes[visualizerMode]}
            </div>
          </div>

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
