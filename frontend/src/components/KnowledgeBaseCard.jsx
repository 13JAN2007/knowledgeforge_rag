import { useNavigate } from 'react-router-dom'
import { FileText, Layers, Calendar, MessageSquare, Trash2, ExternalLink } from 'lucide-react'
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore'
import './KnowledgeBaseCard.css'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const formatNumber = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

export default function KnowledgeBaseCard({ kb, onDelete }) {
  const navigate = useNavigate()

  const handleCardClick = () => navigate(`/kb/${kb.id}`)

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete?.(kb)
  }

  const handleChat = (e) => {
    e.stopPropagation()
    navigate(`/kb/${kb.id}/chat`)
  }

  return (
    <div className="kb-card glass-card animate-fade-up" onClick={handleCardClick} id={`kb-card-${kb.id}`}>
      {/* Header */}
      <div className="kb-card-header">
        <div className="kb-card-icon">
          <FileText size={20} />
        </div>
        <div className="kb-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-icon btn-ghost kb-action-btn"
            onClick={handleChat}
            data-tooltip="Open Chat"
            id={`kb-chat-btn-${kb.id}`}
          >
            <MessageSquare size={15} />
          </button>
          <button
            className="btn btn-icon btn-ghost kb-action-btn danger"
            onClick={handleDelete}
            data-tooltip="Delete"
            id={`kb-delete-btn-${kb.id}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="kb-card-content">
        <h3 className="kb-card-name">{kb.name}</h3>
        {kb.description && <p className="kb-card-desc">{kb.description}</p>}
      </div>

      {/* Stats */}
      <div className="kb-card-stats">
        <div className="kb-stat">
          <FileText size={13} />
          <span>{kb.document_count} documents</span>
        </div>
        <div className="kb-stat">
          <Layers size={13} />
          <span>{formatNumber(kb.chunk_count)} chunks</span>
        </div>
      </div>

      {/* Footer */}
      <div className="kb-card-footer">
        <span className="kb-card-date">
          <Calendar size={12} />
          Updated {formatDate(kb.updated_at)}
        </span>
        <span className="kb-card-open">
          Open <ExternalLink size={12} />
        </span>
      </div>
    </div>
  )
}
