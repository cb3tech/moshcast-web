import { createContext, useContext, useState, useRef, useEffect } from 'react'
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
  const [repeat, setRepeat] = useState('none') // none, all, one
  
  const howlRef = useRef(null)
  const progressInterval = useRef(null)

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

  const playSong = (song, newQueue = [], index = 0) => {
    // Validate song has file_url
    if (!song?.file_url) {
      console.error('Cannot play song: missing file_url', song)
      return
    }

    // Stop current song
    if (howlRef.current) {
      howlRef.current.unload()
    }

    // Update queue
    if (newQueue.length > 0) {
      setQueue(newQueue)
      setQueueIndex(index)
    }

    setCurrentSong(song)
    setProgress(0)

    // Create new Howl
    howlRef.current = new Howl({
      src: [song.file_url],
      html5: true,
      volume: volume,
      format: ['mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg'],
      onload: () => {
        setDuration(howlRef.current.duration())
      },
      onplay: () => {
        setIsPlaying(true)
      },
      onpause: () => {
        setIsPlaying(false)
      },
      onend: () => {
        handleSongEnd()
      },
      onloaderror: (id, error) => {
        console.error('Load error:', error)
      },
      onplayerror: (id, error) => {
        console.error('Play error:', error)
        // Try to unlock and replay
        howlRef.current.once('unlock', () => {
          howlRef.current.play()
        })
      }
    })

    howlRef.current.play()
  }

  const handleSongEnd = () => {
    if (repeat === 'one') {
      // Repeat current song
      howlRef.current.seek(0)
      howlRef.current.play()
    } else if (queueIndex < queue.length - 1) {
      // Play next in queue
      nextSong()
    } else if (repeat === 'all' && queue.length > 0) {
      // Repeat queue from beginning
      playSong(queue[0], queue, 0)
    } else {
      // End of queue
      setIsPlaying(false)
    }
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
    if (queue.length === 0) return

    let nextIndex
    if (shuffle) {
      // Random song (not current)
      const available = queue.filter((_, i) => i !== queueIndex)
      if (available.length === 0) return
      const randomSong = available[Math.floor(Math.random() * available.length)]
      nextIndex = queue.indexOf(randomSong)
    } else {
      nextIndex = (queueIndex + 1) % queue.length
    }

    playSong(queue[nextIndex], queue, nextIndex)
  }

  const prevSong = () => {
    if (queue.length === 0) return

    // If more than 3 seconds in, restart current song
    if (progress > 3) {
      seek(0)
      return
    }

    let prevIndex
    if (shuffle) {
      const available = queue.filter((_, i) => i !== queueIndex)
      if (available.length === 0) return
      const randomSong = available[Math.floor(Math.random() * available.length)]
      prevIndex = queue.indexOf(randomSong)
    } else {
      prevIndex = (queueIndex - 1 + queue.length) % queue.length
    }

    playSong(queue[prevIndex], queue, prevIndex)
  }

  const toggleShuffle = () => {
    setShuffle(!shuffle)
  }

  const toggleRepeat = () => {
    const modes = ['none', 'all', 'one']
    const currentIndex = modes.indexOf(repeat)
    setRepeat(modes[(currentIndex + 1) % modes.length])
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
      repeat,
      howlRef,
      playSong,
      togglePlay,
      seek,
      setVolume,
      nextSong,
      prevSong,
      toggleShuffle,
      toggleRepeat
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
