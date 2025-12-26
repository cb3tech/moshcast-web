import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'

const PlayerContext = createContext()

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [autoplay, setAutoplay] = useState(true)
  
  // Use native Audio element instead of Howler for CORS/visualizer support
  const audioRef = useRef(null)
  const progressInterval = useRef(null)
  
  // Audio visualization refs
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceNodeRef = useRef(null)
  
  // Refs to track current values for callbacks
  const queueRef = useRef(queue)
  const queueIndexRef = useRef(queueIndex)
  const autoplayRef = useRef(autoplay)
  const shuffleRef = useRef(shuffle)
  const volumeRef = useRef(volume)
  
  // Keep refs in sync
  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { queueIndexRef.current = queueIndex }, [queueIndex])
  useEffect(() => { autoplayRef.current = autoplay }, [autoplay])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  useEffect(() => { volumeRef.current = volume }, [volume])

  const playSongInternalRef = useRef(null)
  const handleSongEndRef = useRef(null)

  // Create audio element once on mount
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'  // Set BEFORE any src is loaded - required for Web Audio API
    audio.preload = 'auto'
    audioRef.current = audio
    
    // Event listeners
    audio.addEventListener('loadedmetadata', () => {
      console.log('🎵 Audio loadedmetadata - duration:', audio.duration)
      setDuration(audio.duration)
    })
    
    audio.addEventListener('play', () => {
      console.log('🎵 Audio play event')
      setIsPlaying(true)
    })
    
    audio.addEventListener('pause', () => {
      setIsPlaying(false)
    })
    
    audio.addEventListener('ended', () => {
      console.log('🎵 Audio ended')
      if (handleSongEndRef.current) {
        handleSongEndRef.current()
      }
    })
    
    audio.addEventListener('error', (e) => {
      console.error('🎵 Audio error:', e.target.error)
    })

    return () => {
      audio.pause()
      audio.src = ''
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Update progress
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime || 0)
        }
      }, 250)
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [isPlaying])

  // Setup audio analyser - called once on first play
  const setupAudioAnalyser = useCallback(() => {
    const audio = audioRef.current
    if (!audio || sourceNodeRef.current) return // Already setup
    
    try {
      // Create AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      
      // Create analyser
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        analyserRef.current.smoothingTimeConstant = 0.8
      }
      
      // Connect audio element to analyser
      // createMediaElementSource can only be called ONCE per audio element
      const source = audioContextRef.current.createMediaElementSource(audio)
      source.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)
      sourceNodeRef.current = source
      
      console.log('🎨 Audio analyser connected successfully!')
    } catch (e) {
      console.warn('🎨 Analyser setup failed:', e.message)
    }
  }, [])

  // Play next song
  const playNextSong = useCallback(() => {
    const currentQueue = queueRef.current
    const currentIndex = queueIndexRef.current
    const isShuffle = shuffleRef.current
    
    console.log('🎵 playNextSong:', { currentIndex, queueLength: currentQueue.length })
    
    if (currentQueue.length === 0) return false

    let nextIndex
    if (isShuffle) {
      const available = currentQueue.filter((_, i) => i !== currentIndex)
      if (available.length === 0) return false
      const randomSong = available[Math.floor(Math.random() * available.length)]
      nextIndex = currentQueue.indexOf(randomSong)
    } else {
      nextIndex = currentIndex + 1
      if (nextIndex >= currentQueue.length) {
        console.log('🎵 End of queue')
        return false
      }
    }

    const nextSongToPlay = currentQueue[nextIndex]
    console.log('🎵 Playing next:', nextSongToPlay?.title)
    if (nextSongToPlay && playSongInternalRef.current) {
      playSongInternalRef.current(nextSongToPlay, currentQueue, nextIndex)
      return true
    }
    return false
  }, [])

  const handleSongEnd = useCallback(() => {
    console.log('🎵 Song ended, autoplay:', autoplayRef.current)
    if (autoplayRef.current) {
      const played = playNextSong()
      if (!played) {
        setIsPlaying(false)
      }
    } else {
      setIsPlaying(false)
    }
  }, [playNextSong])
  
  handleSongEndRef.current = handleSongEnd

  // Internal play function
  const playSongInternal = useCallback((song, songQueue, index) => {
    console.log('🎵 playSongInternal:', { song: song?.title, index, queueLength: songQueue.length })
    
    if (!song?.file_url) {
      console.error('Cannot play song: missing file_url')
      return
    }

    const audio = audioRef.current
    if (!audio) return

    // Update refs IMMEDIATELY
    queueRef.current = songQueue
    queueIndexRef.current = index
    
    // Update state
    setQueue(songQueue)
    setQueueIndex(index)
    setCurrentSong(song)
    setProgress(0)

    // Setup analyser on first play (only once per audio element)
    if (!sourceNodeRef.current) {
      setupAudioAnalyser()
    }
    
    // Resume audio context if suspended (browser autoplay policy)
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume()
    }

    // Load and play new song
    audio.src = song.file_url
    audio.volume = volumeRef.current
    audio.play().catch(e => {
      console.error('🎵 Play failed:', e)
    })
  }, [setupAudioAnalyser])
  
  playSongInternalRef.current = playSongInternal

  const playSong = useCallback((song, newQueue = [], index = 0) => {
    console.log('🎵 playSong called:', { song: song?.title, queueLength: newQueue.length, index })
    playSongInternal(song, newQueue.length > 0 ? newQueue : queueRef.current, index)
  }, [playSongInternal])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!audio.src && currentSong?.file_url) {
      playSong(currentSong, queueRef.current, queueIndexRef.current)
      return
    }

    if (isPlaying) {
      audio.pause()
    } else {
      // Resume context if needed
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume()
      }
      audio.play().catch(e => console.error('Play failed:', e))
    }
  }, [isPlaying, currentSong, playSong])

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setProgress(time)
    }
  }, [])

  const setVolume = useCallback((vol) => {
    setVolumeState(vol)
    volumeRef.current = vol
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }, [])

  const nextSong = useCallback(() => {
    playNextSong()
  }, [playNextSong])

  const prevSong = useCallback(() => {
    const currentQueue = queueRef.current
    const currentIndex = queueIndexRef.current
    
    if (currentQueue.length === 0) return

    // If more than 3 seconds in, restart current song
    if (progress > 3) {
      seek(0)
      return
    }

    let prevIndex
    if (shuffleRef.current) {
      const available = currentQueue.filter((_, i) => i !== currentIndex)
      if (available.length === 0) return
      const randomSong = available[Math.floor(Math.random() * available.length)]
      prevIndex = currentQueue.indexOf(randomSong)
    } else {
      prevIndex = currentIndex - 1
      if (prevIndex < 0) {
        seek(0)
        return
      }
    }

    if (playSongInternalRef.current) {
      playSongInternalRef.current(currentQueue[prevIndex], currentQueue, prevIndex)
    }
  }, [progress, seek])

  const toggleShuffle = useCallback(() => {
    setShuffle(s => !s)
  }, [])

  const toggleAutoplay = useCallback(() => {
    setAutoplay(a => !a)
  }, [])

  return (
    <PlayerContext.Provider value={{
      currentSong,
      isPlaying,
      progress,
      duration,
      volume,
      queue,
      queueIndex,
      shuffle,
      autoplay,
      audioRef,        // Expose for components that need it
      analyserRef,     // For visualizer
      audioContextRef, // For visualizer
      playSong,
      togglePlay,
      seek,
      setVolume,
      nextSong,
      prevSong,
      toggleShuffle,
      toggleAutoplay
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider')
  }
  return context
}
