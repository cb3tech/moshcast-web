import { createContext, useContext, useState, useRef, useEffect } from 'react'
import { Howl } from 'howler'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('none') // 'none', 'all', 'one'
  
  const howlRef = useRef(null)
  const timeInterval = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload()
      }
      if (timeInterval.current) {
        clearInterval(timeInterval.current)
      }
    }
  }, [])

  // Update time tracking
  const startTimeTracking = () => {
    if (timeInterval.current) {
      clearInterval(timeInterval.current)
    }
    timeInterval.current = setInterval(() => {
      if (howlRef.current && howlRef.current.playing()) {
        setCurrentTime(howlRef.current.seek())
      }
    }, 1000)
  }

  const stopTimeTracking = () => {
    if (timeInterval.current) {
      clearInterval(timeInterval.current)
    }
  }

  // Play a song
  const playSong = (song, songQueue = [], index = 0) => {
    // Validate song has file_url
    if (!song || !song.file_url) {
      console.error('Cannot play song: missing file_url', song)
      return
    }

    console.log('Playing song:', song.title, song.file_url)

    // Stop current playback
    if (howlRef.current) {
      howlRef.current.unload()
    }
    stopTimeTracking()

    // Set up new song
    setCurrentSong(song)
    setQueue(songQueue.length > 0 ? songQueue : [song])
    setQueueIndex(songQueue.length > 0 ? index : 0)
    setCurrentTime(0)
    setDuration(song.duration || 0)

    // Create new Howl instance
    howlRef.current = new Howl({
      src: [song.file_url],
      html5: true, // Required for streaming large files
      volume: volume,
      format: ['mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg'],
      onload: () => {
        console.log('Howl loaded, duration:', howlRef.current.duration())
        setDuration(howlRef.current.duration())
      },
      onplay: () => {
        console.log('Howl playing')
        setIsPlaying(true)
        startTimeTracking()
      },
      onpause: () => {
        setIsPlaying(false)
        stopTimeTracking()
      },
      onend: () => {
        handleSongEnd()
      },
      onloaderror: (id, err) => {
        console.error('Howl load error:', id, err)
        setIsPlaying(false)
      },
      onplayerror: (id, err) => {
        console.error('Howl play error:', id, err)
        setIsPlaying(false)
        // Try to unlock and play again
        if (howlRef.current) {
          howlRef.current.once('unlock', () => {
            howlRef.current.play()
          })
        }
      },
    })

    howlRef.current.play()
  }

  // Handle song end
  const handleSongEnd = () => {
    if (repeat === 'one') {
      howlRef.current.seek(0)
      howlRef.current.play()
    } else if (queueIndex < queue.length - 1) {
      playNext()
    } else if (repeat === 'all') {
      playSong(queue[0], queue, 0)
    } else {
      setIsPlaying(false)
      stopTimeTracking()
    }
  }

  // Play/pause toggle
  const togglePlay = () => {
    if (!howlRef.current) {
      // If no howl but we have a current song, recreate it
      if (currentSong && currentSong.file_url) {
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

  // Play next song
  const playNext = () => {
    if (queue.length === 0) return

    let nextIndex
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else {
      nextIndex = (queueIndex + 1) % queue.length
    }

    playSong(queue[nextIndex], queue, nextIndex)
  }

  // Play previous song
  const playPrev = () => {
    if (queue.length === 0) return

    // If more than 3 seconds in, restart current song
    if (currentTime > 3) {
      seek(0)
      return
    }

    let prevIndex
    if (shuffle) {
      prevIndex = Math.floor(Math.random() * queue.length)
    } else {
      prevIndex = queueIndex === 0 ? queue.length - 1 : queueIndex - 1
    }

    playSong(queue[prevIndex], queue, prevIndex)
  }

  // Seek to position
  const seek = (time) => {
    if (howlRef.current) {
      howlRef.current.seek(time)
      setCurrentTime(time)
    }
  }

  // Set volume
  const changeVolume = (vol) => {
    setVolume(vol)
    if (howlRef.current) {
      howlRef.current.volume(vol)
    }
  }

  // Toggle shuffle
  const toggleShuffle = () => {
    setShuffle(!shuffle)
  }

  // Cycle repeat mode
  const toggleRepeat = () => {
    const modes = ['none', 'all', 'one']
    const currentIndex = modes.indexOf(repeat)
    setRepeat(modes[(currentIndex + 1) % modes.length])
  }

  return (
    <PlayerContext.Provider value={{
      currentSong,
      queue,
      queueIndex,
      isPlaying,
      duration,
      currentTime,
      volume,
      shuffle,
      repeat,
      playSong,
      togglePlay,
      playNext,
      playPrev,
      seek,
      changeVolume,
      toggleShuffle,
      toggleRepeat,
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
