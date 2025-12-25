import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { upload as uploadAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { formatFileSize } from '../utils/format'
import { Upload as UploadIcon, X, CheckCircle, AlertCircle, Loader2, Music } from 'lucide-react'

export default function Upload() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  // Handle file selection
  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(file => {
      const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 
                         'audio/flac', 'audio/x-flac', 'audio/wav', 'audio/x-wav', 'audio/ogg']
      return validTypes.includes(file.type)
    })

    const fileObjects = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      status: 'pending', // pending, uploading, success, error
      progress: 0,
      error: null,
    }))

    setFiles(prev => [...prev, ...fileObjects])
  }

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  // Remove file from list
  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  // Upload all files
  const uploadAll = async () => {
    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const fileObj = files[i]
      if (fileObj.status !== 'pending') continue

      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'uploading' } : f
      ))

      try {
        await uploadAPI.single(fileObj.file, (progress) => {
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, progress } : f
          ))
        })

        // Update status to success
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'success', progress: 100 } : f
        ))
      } catch (err) {
        // Update status to error
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'error', error: err.message } : f
        ))
      }
    }

    setUploading(false)
    refreshUser() // Update storage stats
  }

  // Check if all uploads complete
  const allComplete = files.length > 0 && files.every(f => f.status === 'success' || f.status === 'error')
  const hasSuccess = files.some(f => f.status === 'success')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-mosh-light mb-8">Upload Music</h1>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
          dragActive 
            ? 'border-mosh-accent bg-mosh-accent/10' 
            : 'border-mosh-border hover:border-mosh-muted'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadIcon className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-mosh-accent' : 'text-mosh-muted'}`} />
        <p className="text-lg text-mosh-light mb-2">
          Drag and drop your music files here
        </p>
        <p className="text-mosh-muted mb-4">
          MP3, M4A, AAC, FLAC, WAV, OGG supported
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-mosh-card hover:bg-mosh-hover text-mosh-light rounded-full transition"
        >
          Browse Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-mosh-light">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </h2>
            {!uploading && !allComplete && (
              <button
                onClick={uploadAll}
                className="px-6 py-2 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-medium rounded-full transition"
              >
                Upload All
              </button>
            )}
            {allComplete && hasSuccess && (
              <button
                onClick={() => navigate('/library')}
                className="px-6 py-2 bg-mosh-accent hover:bg-mosh-accent-hover text-mosh-black font-medium rounded-full transition"
              >
                Go to Library
              </button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((fileObj) => (
              <div 
                key={fileObj.id}
                className="flex items-center gap-4 bg-mosh-card rounded-lg p-4"
              >
                {/* Icon */}
                <div className="w-10 h-10 bg-mosh-dark rounded flex items-center justify-center flex-shrink-0">
                  {fileObj.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-mosh-accent" />
                  ) : fileObj.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : fileObj.status === 'uploading' ? (
                    <Loader2 className="w-5 h-5 text-mosh-accent animate-spin" />
                  ) : (
                    <Music className="w-5 h-5 text-mosh-muted" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-mosh-light truncate">
                    {fileObj.name}
                  </p>
                  <p className="text-xs text-mosh-muted">
                    {formatFileSize(fileObj.size)}
                    {fileObj.error && (
                      <span className="text-red-400 ml-2">{fileObj.error}</span>
                    )}
                  </p>
                  
                  {/* Progress Bar */}
                  {fileObj.status === 'uploading' && (
                    <div className="mt-2 h-1 bg-mosh-dark rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-mosh-accent transition-all duration-300"
                        style={{ width: `${fileObj.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                {fileObj.status === 'pending' && (
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    className="p-1 text-mosh-muted hover:text-mosh-light transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 p-4 bg-mosh-card rounded-lg">
        <h3 className="text-sm font-medium text-mosh-light mb-2">Tips</h3>
        <ul className="text-sm text-mosh-text space-y-1">
          <li>• Files are automatically tagged with artist, album, and artwork</li>
          <li>• Maximum file size: 100 MB per file</li>
          <li>• Upload CDs using our desktop app (coming soon)</li>
        </ul>
      </div>
    </div>
  )
}
