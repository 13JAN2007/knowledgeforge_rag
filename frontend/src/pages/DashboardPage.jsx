import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, FileText, Layers, TrendingUp, X } from 'lucide-react'
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore'
import KnowledgeBaseCard from '../components/KnowledgeBaseCard'
import Modal from '../components/Modal'
import './DashboardPage.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { knowledgeBases, fetchKnowledgeBases, createKnowledgeBase, deleteKnowledgeBase } =
    useKnowledgeBaseStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [kbToDelete, setKbToDelete] = useState(null)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchKnowledgeBases()
  }, [])

  const totalDocs = knowledgeBases.reduce((s, kb) => s + kb.document_count, 0)
  const totalChunks = knowledgeBases.reduce((s, kb) => s + kb.chunk_count, 0)
  const totalKbs = knowledgeBases.length

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim()) return
    setCreating(true)
    const kb = await createKnowledgeBase(createForm)
    setCreating(false)
    setShowCreateModal(false)
    setCreateForm({ name: '', description: '' })
    navigate(`/kb/${kb.id}`)
  }

  const handleDeleteRequest = (kb) => {
    setKbToDelete(kb)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (kbToDelete) {
      await deleteKnowledgeBase(kbToDelete.id)
    }
    setShowDeleteModal(false)
    setKbToDelete(null)
  }

  return (
    <div className="page-container animate-fade-up">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Manage your knowledge bases and monitor indexing status</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            id="dashboard-create-kb-btn"
          >
            <Plus size={16} />
            New Knowledge Base
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="dashboard-stats">
        <div className="dash-stat glass-card">
          <div className="dash-stat-icon violet"><BookOpen size={18} /></div>
          <div>
            <div className="dash-stat-value">{totalKbs}</div>
            <div className="dash-stat-label">Knowledge Bases</div>
          </div>
        </div>
        <div className="dash-stat glass-card">
          <div className="dash-stat-icon cyan"><FileText size={18} /></div>
          <div>
            <div className="dash-stat-value">{totalDocs}</div>
            <div className="dash-stat-label">Documents</div>
          </div>
        </div>
        <div className="dash-stat glass-card">
          <div className="dash-stat-icon violet"><Layers size={18} /></div>
          <div>
            <div className="dash-stat-value">{(totalChunks / 1000).toFixed(1)}k</div>
            <div className="dash-stat-label">Total Chunks</div>
          </div>
        </div>
        <div className="dash-stat glass-card">
          <div className="dash-stat-icon cyan"><TrendingUp size={18} /></div>
          <div>
            <div className="dash-stat-value">98%</div>
            <div className="dash-stat-label">Index Success Rate</div>
          </div>
        </div>
      </div>

      {/* KB Grid */}
      <div className="dashboard-section">
        <h2 className="section-title">Your Knowledge Bases</h2>
        {knowledgeBases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={28} /></div>
            <h3>No knowledge bases yet</h3>
            <p>Create your first knowledge base to start uploading documents and chatting with your data.</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} id="empty-create-btn">
              <Plus size={16} /> Create Knowledge Base
            </button>
          </div>
        ) : (
          <div className="grid-cards">
            {knowledgeBases.map((kb) => (
              <KnowledgeBaseCard key={kb.id} kb={kb} onDelete={handleDeleteRequest} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Knowledge Base"
        size="sm"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label" htmlFor="kb-name-input">Name *</label>
            <input
              id="kb-name-input"
              className="input"
              placeholder="e.g., Product Documentation"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="kb-desc-input">Description</label>
            <textarea
              id="kb-desc-input"
              className="input textarea"
              placeholder="What kind of documents will this contain?"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!createForm.name.trim() || creating} id="create-kb-submit-btn">
              {creating ? <><span className="spinner" /> Creating...</> : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Knowledge Base"
        size="sm"
      >
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--color-text-primary)' }}>
            {kbToDelete?.name}
          </strong>? This will permanently remove all documents and conversations.
        </p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDeleteConfirm} id="confirm-delete-kb-btn">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}
