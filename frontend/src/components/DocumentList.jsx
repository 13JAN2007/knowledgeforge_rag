import { FileText, Trash2, Clock, CheckCircle, AlertCircle, Loader, File } from 'lucide-react'
import './DocumentList.css'

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    icon: Clock,        cls: 'badge-pending' },
  processing: { label: 'Processing', icon: Loader,       cls: 'badge-processing' },
  ready:      { label: 'Ready',      icon: CheckCircle,  cls: 'badge-ready' },
  error:      { label: 'Error',      icon: AlertCircle,  cls: 'badge-error' },
}

const FILE_ICONS = {
  pdf:  { color: '#ef4444' },
  docx: { color: '#3b82f6' },
  txt:  { color: '#6b7280' },
  csv:  { color: '#10b981' },
}

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function DocumentList({ documents, onDelete }) {
  if (!documents?.length) return null

  return (
    <div className="doc-list">
      {documents.map((doc) => {
        const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending
        const StatusIcon = status.icon
        const fileColor = FILE_ICONS[doc.file_type]?.color || '#6b7280'

        return (
          <div className="doc-item glass-card" key={doc.id} id={`doc-item-${doc.id}`}>
            <div className="doc-item-icon" style={{ color: fileColor }}>
              <FileText size={18} />
            </div>

            <div className="doc-item-info">
              <div className="doc-item-name">{doc.original_filename}</div>
              <div className="doc-item-meta">
                <span className="doc-meta-tag">{doc.file_type?.toUpperCase()}</span>
                <span>{formatBytes(doc.file_size_bytes)}</span>
                {doc.page_count > 0 && <span>{doc.page_count} pages</span>}
                {doc.chunk_count > 0 && <span>{doc.chunk_count} chunks</span>}
                <span>{formatDate(doc.created_at)}</span>
              </div>
            </div>

            <div className={`badge ${status.cls}`}>
              <span className="badge-dot" />
              {status.icon === Loader
                ? <Loader size={11} className="spin" />
                : <StatusIcon size={11} />
              }
              {status.label}
            </div>

            {doc.error_message && (
              <div className="doc-error">{doc.error_message}</div>
            )}

            <button
              className="btn btn-icon btn-ghost doc-delete-btn"
              onClick={() => onDelete?.(doc)}
              data-tooltip="Delete document"
              id={`doc-delete-${doc.id}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
