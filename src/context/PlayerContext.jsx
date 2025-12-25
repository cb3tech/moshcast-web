import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { Howl } from 'howler'

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
  const [autoplay, setAutoplay] = useState(true) // Autoplay next song by default
  
  const howlRef = useRef(null)
  const progressInterval = useRef(null)
  
  // Refs to track current values for callbacks (avoid stale closures)
  const queueRef = useRef(queue)
  const queueIndexRef = useRef(queueIndex)
  const autoplayRef = useRef(autoplay)
  const shuffleRef = useRef(shuffle)
  
  // Keep refs in sync
  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { queueIndexRef.current = queueIndex }, [queueIndex])
  useEffect(() => { autoplayRef.current = autoplay }, [autoplay])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])

  // Ref for playSongInternal to avoid stale closures
  const playSongInternalRef = useRef(null)
  const handleSongEndRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload()
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [])

  // Update progress
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        if (howlRef.current) {
          setProgress(howlRef.current.seek() || 0)
        }
      }, 1000)
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

  // Play next song (used by handleSongEnd and nextSong button)
  const playNextSong = useCallback(() => {
    const currentQueue = queueRef.current
    const currentIndex = queueIndexRef.current
    const isShuffle = shuffleRef.current
    
    console.log('🎵 playNextSong:', { currentIndex, queueLength: currentQueue.length, isShuffle })
    
    if (currentQueue.length === 0) return false

    let nextIndex
    if (isShuffle) {
      // Random song (not current)
      const available = currentQueue.filter((_, i) => i !== currentIndex)
      if (available.length === 0) return false
      const randomSong = available[Math.floor(Math.random() * available.length)]
      nextIndex = currentQueue.indexOf(randomSong)
    } else {
      nextIndex = currentIndex + 1
      console.log('🎵 Calculated nextIndex:', nextIndex)
      // Stop at end of queue (no wrap around)
      if (nextIndex >= currentQueue.length) {
        console.log('🎵 End of queue reached')
        return false
      }
    }

    // Play the next song via ref (avoids stale closure)
    const nextSongToPlay = currentQueue[nextIndex]
    console.log('🎵 Playing next song:', nextSongToPlay?.title, 'at index', nextIndex)
    if (nextSongToPlay && playSongInternalRef.current) {
      playSongInternalRef.current(nextSongToPlay, currentQueue, nextIndex)
      return true
    }
    return false
  }, [])

  const handleSongEnd = useCallback(() => {
    console.log('🎵 Song ended, autoplay:', autoplayRef.current)
    if (autoplayRef.current) {
      // Autoplay ON: play next song if available
      const played = playNextSong()
      if (!played) {
        // End of queue - stop
        setIsPlaying(false)
      }
    } else {
      // Autoplay OFF: stop after current song
      setIsPlaying(false)
    }
  }, [playNextSong])
  
  // Keep handleSongEnd ref updated
  handleSongEndRef.current = handleSongEnd

  // Internal play function (doesn't depend on state)
  const playSongInternal = (song, songQueue, index) => {
    console.log('🎵 playSongInternal:', { song: song?.title, index, queueLength: songQueue.length })
    
    if (!song?.file_url) {
      console.error('Cannot play song: missing file_url', song)
      return
    }

    // Stop current song
    if (howlRef.current) {
      howlRef.current.unload()
    }

    // Update refs IMMEDIATELY (don't wait for useEffect)
    queueRef.current = songQueue
    queueIndexRef.current = index
    
    // Also update React state
    setQueue(songQueue)
    setQueueIndex(index)
    setCurrentSong(song)
    
    console.log('🎵 Updated queueIndexRef to:', queueIndexRef.current)
    setProgress(0)

    // Create new Howl
    howlRef.current = new Howl({
      src: [song.file_url],
      html5: true,
      volume: volume,
      format: ['mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg'],
      onload: () => {
        console.log('🎵 Howl onload - duration:', howlRef.current.duration())
        setDuration(howlRef.current.duration())
      },
      onplay: () => {
        console.log('🎵 Howl onplay')
        setIsPlaying(true)
      },
      onpause: () => {
        setIsPlaying(false)
      },
      onend: () => {
        // Use ref to always get latest handleSongEnd
        if (handleSongEndRef.current) {
          handleSongEndRef.current()
        }
      },
      onloaderror: (id, error) => {
        console.error('🎵 Howl load error:', error)
      },
      onplayerror: (id, error) => {
        console.error('🎵 Howl play error:', error)
        howlRef.current.once('unlock', () => {
          howlRef.current.play()
        })
      }
    })

    howlRef.current.play()
  }
  
  // Keep playSongInternal ref updated
  playSongInternalRef.current = playSongInternal

  const playSong = (song, newQueue = [], index = 0) => {
    console.log('🎵 playSong called:', { song: song?.title, queueLength: newQueue.length, index })
    playSongInternal(song, newQueue.length > 0 ? newQueue : queue, index)
  }

  const togglePlay = () => {
    if (!howlRef.current) {
      // If no song loaded but we have a current song, reload it
      if (currentSong?.file_url) {
        playSong(currentSong, queue, queueIndex)
      }
      return
    }

    if (isPlaying) {
      howlRef.current.pause()
    } else {
      howlRef.current.play()
    }
  }

  const seek = (time) => {
    if (howlRef.current) {
      howlRef.current.seek(time)
      setProgress(time)
    }
  }

  const setVolume = (vol) => {
    setVolumeState(vol)
    if (howlRef.current) {
      howlRef.current.volume(vol)
    }
  }

  const nextSong = () => {
    playNextSong()
  }

  const prevSong = () => {
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
      // Stop at beginning (no wrap around)
      if (prevIndex < 0) {
        seek(0)
        return
      }
    }

    if (playSongInternalRef.current) {
      playSongInternalRef.current(currentQueue[prevIndex], currentQueue, prevIndex)
    }
  }

  const toggleShuffle = () => {
    setShuffle(!shuffle)
  }

  const toggleAutoplay = () => {
    setAutoplay(!autoplay)
  }

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
      howlRef,
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
