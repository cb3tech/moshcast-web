const API_BASE = 'https://moshcast-production.up.railway.app/api'

// Get token from localStorage
const getToken = () => localStorage.getItem('moshcast_token')

// Generic fetch wrapper with auth
async function fetchAPI(endpoint, options = {}) {
  const token = getToken()
  
  const headers = {
    ...options.headers,
  }
  
  // Add auth header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // Add content-type for JSON bodies
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
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
    fetchAPI('/auth/signup', {
      method: 'POST',
      body: { email, password, username }
    }),
    
  login: (email, password) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: { email, password }
    }),
    
  me: () => fetchAPI('/auth/me'),
}

// Library API
export const library = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetchAPI(`/library${query ? `?${query}` : ''}`)
  },
  
  getAlbums: () => fetchAPI('/library/albums'),
  
  getArtists: () => fetchAPI('/library/artists'),
  
  getRecent: (limit = 20) => fetchAPI(`/library/recent?limit=${limit}`),
  
  getSong: (id) => fetchAPI(`/library/${id}`),
  
  updateSong: (id, data) => 
    fetchAPI(`/library/${id}`, {
      method: 'PUT',
      body: data
    }),
    
  deleteSong: (id) =>
    fetchAPI(`/library/${id}`, {
      method: 'DELETE'
    }),
}

// Upload API
export const upload = {
  single: async (file, onProgress) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)
    
    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed'))
        }
      })
      
      xhr.addEventListener('error', () => reject(new Error('Upload failed')))
      
      xhr.open('POST', `${API_BASE}/upload`)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(formData)
    })
  },
  
  getStorage: () => fetchAPI('/upload/storage'),
}

// Playlists API
export const playlists = {
  getAll: () => fetchAPI('/playlists'),
  
  get: (id) => fetchAPI(`/playlists/${id}`),
  
  create: (name, description) =>
    fetchAPI('/playlists', {
      method: 'POST',
      body: { name, description }
    }),
    
  update: (id, data) =>
    fetchAPI(`/playlists/${id}`, {
      method: 'PUT',
      body: data
    }),
    
  delete: (id) =>
    fetchAPI(`/playlists/${id}`, {
      method: 'DELETE'
    }),
    
  addSong: (playlistId, songId) =>
    fetchAPI(`/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: { song_id: songId }
    }),
    
  removeSong: (playlistId, songId) =>
    fetchAPI(`/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE'
    }),
}

export default { auth, library, upload, playlists }
