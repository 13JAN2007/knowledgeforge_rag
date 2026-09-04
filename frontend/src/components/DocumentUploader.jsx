import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import './DocumentUploader.css'

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
}

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentUploader({ onUpload, uploading, progress }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((file) => onUpload?.(file))
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024,
    disabled: uploading,
  })

  return (
    <div className="uploader">
      <div
        {...getRootProps()}
        className={`uploader-zone ${isDragActive ? 'drag-active' : ''} ${uploading ? 'disabled' : ''}`}
        id="document-upload-zone"
      >
        <input {...getInputProps()} id="document-file-input" />

        {uploading ? (
          <div className="uploader-uploading">
            <div className="uploader-progress-ring">
              <Loader size={28} className="spin" />
            </div>
            <p className="uploader-uploading-text">Uploading...</p>
            <div className="uploader-progress-bar-wrap">
              <div className="uploader-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <span className="uploader-progress-pct">{progress}%</span>
          </div>
        ) : (
          <>
            <div className={`uploader-icon ${isDragActive ? 'active' : ''}`}>
              <Upload size={28} />
            </div>
            <p className="uploader-title">
              {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
            </p>
            <p className="uploader-subtitle">or click to browse</p>
            <div className="uploader-formats">
              {['PDF', 'DOCX', 'TXT', 'CSV'].map((f) => (
                <span key={f} className="uploader-format-tag">{f}</span>
              ))}
            </div>
            <p className="uploader-limit">Maximum file size: 50 MB</p>
          </>
        )}
      </div>
    </div>
  )
}
