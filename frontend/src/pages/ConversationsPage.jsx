import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, MessageSquare, Trash2, Clock } from 'lucide-react'
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore'
import { useChatStore } from '../store/chatStore'
import Modal from '../components/Modal'
import './ConversationsPage.css'

const formatRelativeDate = (iso) => {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function ConversationsPage() {
  const { kbId } = useParams()
  const navigate = useNavigate()
  const { currentKb, fetchKnowledgeBase } = useKnowledgeBaseStore()
  const { getConversationsForKb, setActiveConversation } = useChatStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [convToDelete, setConvToDelete] = useState(null)

  useEffect(() => { fetchKnowledgeBase(kbId) }, [kbId])

  const conversations = getConversationsForKb(kbId)

  const handleOpen = (conv) => {
    setActiveConversation(conv)
    navigate(`/kb/${kbId}/chat`)
  }

  const handleDeleteRequest = (e, conv) => {
    e.stopPropagation()
    setConvToDelete(conv)
    setShowDeleteModal(true)
  }

  return (
    <div className="page-container animate-fade-up">
      <button className="btn btn-ghost btn-sm back-btn" onClick={() => navigate(`/kb/${kbId}`)}>
        <ArrowLeft size={16} /> Back to Knowledge Base
      </button>

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Conversations</h1>
          <p className="page-subtitle">{currentKb?.name} — conversation history</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/kb/${kbId}/chat`)}
            id="convs-new-btn"
          >
            <Plus size={16} /> New Conversation
          </button>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MessageSquare size={28} /></div>
          <h3>No conversations yet</h3>
          <p>Start chatting with your knowledge base to see your conversation history here.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/kb/${kbId}/chat`)}>
            Start Chatting
          </button>
        </div>
      ) : (
        <div className="conv-grid">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="conv-card glass-card"
              onClick={() => handleOpen(conv)}
              id={`conv-card-${conv.id}`}
            >
              <div className="conv-card-icon">
                <MessageSquare size={18} />
              </div>
              <div className="conv-card-content">
                <h3 className="conv-card-title">{conv.title}</h3>
                <div className="conv-card-meta">
                  <Clock size={12} />
                  <span>{formatRelativeDate(conv.updated_at)}</span>
                </div>
              </div>
              <button
                className="btn btn-icon btn-ghost conv-delete-btn"
                onClick={(e) => handleDeleteRequest(e, conv)}
                data-tooltip="Delete"
                id={`conv-delete-${conv.id}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Conversation" size="sm">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Delete "<strong style={{ color: 'var(--color-text-primary)' }}>{convToDelete?.title}</strong>"?
          All messages will be permanently removed.
        </p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => setShowDeleteModal(false)} id="confirm-delete-conv-btn">Delete</button>
        </div>
      </Modal>
    </div>
  )
}
