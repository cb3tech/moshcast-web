/**
 * API Client for Moshcast Backend
 */

const API_URL = 'https://moshcast-production.up.railway.app/api'

// Get auth token from localStorage
const getToken = () => localStorage.getItem('moshcast_token')

// Fetch wrapper with auth
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getToken()
  
  const headers = {
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Don't set Content-Type for FormData (let browser set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

// Auth API
export const auth = {
  signup: (email, password, username) =>
    fetchWithAuth('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    }),

  login: (email, password) =>
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => fetchWithAuth('/auth/me'),

  updatePlan: (plan) =>
    fetchWithAuth('/auth/plan', {
      method: 'PUT',
      body: JSON.stringify({ plan }),
    }),
}

// Library API
export const library = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetchWithAuth(`/library${query ? `?${query}` : ''}`)
  },

  getRecent: (limit = 20) =>
    fetchWithAuth(`/library/recent?limit=${limit}`),

  getAlbums: () => fetchWithAuth('/library/albums'),

  getArtists: () => fetchWithAuth('/library/artists'),

  getSong: (id) => fetchWithAuth(`/library/${id}`),

  updateSong: (id, data) =>
    fetchWithAuth(`/library/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSong: (id) =>
    fetchWithAuth(`/library/${id}`, {
      method: 'DELETE',
    }),
}

// Upload API
export const upload = {
  single: async (file, onProgress) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)

    // Using XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100)
          onProgress(percent)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          const error = JSON.parse(xhr.responseText)
          reject(new Error(error.error || 'Upload failed'))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      xhr.open('POST', `${API_URL}/upload`)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(formData)
    })
  },

  batch: async (files) => {
    const token = getToken()
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const response = await fetch(`${API_URL}/upload/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Batch upload failed')
    }
    return data
  },

  getStorage: () => fetchWithAuth('/upload/storage'),
}

// Playlists API
export const playlists = {
  getAll: () => fetchWithAuth('/playlists'),

  get: (id) => fetchWithAuth(`/playlists/${id}`),

  getByShareCode: (code) => fetchWithAuth(`/playlists/share/${code}`),

  create: (data) =>
    fetchWithAuth('/playlists', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    fetchWithAuth(`/playlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    fetchWithAuth(`/playlists/${id}`, {
      method: 'DELETE',
    }),

  addSong: (playlistId, songId) =>
    fetchWithAuth(`/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: JSON.stringify({ song_id: songId }),
    }),

  removeSong: (playlistId, songId) =>
    fetchWithAuth(`/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE',
    }),

  reorder: (playlistId, songIds) =>
    fetchWithAuth(`/playlists/${playlistId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ song_ids: songIds }),
    }),
}
