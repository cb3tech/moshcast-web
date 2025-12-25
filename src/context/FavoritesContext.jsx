import { createContext, useContext, useState, useEffect } from 'react'

const FavoritesContext = createContext()

const STORAGE_KEY = 'moshcast_favorites'

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([])

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setFavorites(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load favorites:', err)
    }
  }, [])

  // Save to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch (err) {
      console.error('Failed to save favorites:', err)
    }
  }, [favorites])

  const addFavorite = (song) => {
    if (!song?.id) return
    
    setFavorites(prev => {
      // Don't add duplicates
      if (prev.some(f => f.id === song.id)) return prev
      return [...prev, {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        artwork_url: song.artwork_url,
        file_url: song.file_url,
        addedAt: new Date().toISOString()
      }]
    })
  }

  const removeFavorite = (songId) => {
    setFavorites(prev => prev.filter(f => f.id !== songId))
  }

  const toggleFavorite = (song) => {
    if (isFavorite(song.id)) {
      removeFavorite(song.id)
    } else {
      addFavorite(song)
    }
  }

  const isFavorite = (songId) => {
    return favorites.some(f => f.id === songId)
  }

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider')
  }
  return context
}
