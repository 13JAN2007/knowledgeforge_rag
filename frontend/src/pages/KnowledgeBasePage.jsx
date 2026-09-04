import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MessageSquare, FileText, Layers, Upload, Clock } from 'lucide-react'
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore'
import { useDocumentStore } from '../store/documentStore'
import { documentsApi } from '../api/documents'
import DocumentUploader from '../components/DocumentUploader'
import DocumentList from '../components/DocumentList'
import Modal from '../components/Modal'
import './KnowledgeBasePage.css'

export default function KnowledgeBasePage() {
  const { kbId } = useParams()
  const navigate = useNavigate()
  const { currentKb, fetchKnowledgeBase } = useKnowledgeBaseStore()
  const {
    getDocumentsForKb,
    uploading,
    uploadProgress,
    setUploading,
    setUploadProgress,
    addDocument,
    removeDocument,
    setDocuments,
  } = useDocumentStore()

  const [activeTab, setActiveTab] = useState('documents')
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false)
  const [docToDelete, setDocToDelete] = useState(null)
  const pollingRef = useRef({})

  useEffect(() => {
    fetchKnowledgeBase(kbId)
    loadDocuments()
    return () => {
      // Clear all polling on unmount
      Object.values(pollingRef.current).forEach(clearInterval)
    }
  }, [kbId])

  const loadDocuments = async () => {
    try {
      const res = await documentsApi.list(kbId)
      if (res.data?.items) {
        setDocuments(kbId, res.data.items)
        // Poll any processing/pending docs
        res.data.items.forEach((doc) => {
          if (doc.status === 'pending' || doc.status === 'processing') {
            startPolling(doc.id)
          }
        })
      }
    } catch {
      // Backend not running — show mock data (already in store)
    }
  }

  const startPolling = (docId) => {
    if (pollingRef.current[docId]) return
    pollingRef.current[docId] = setInterval(async () => {
      try {
        const res = await documentsApi.getStatus(kbId, docId)
        const { status, chunk_count, page_count, error_message } = res.data
        // Update doc in store
        setDocuments(kbId, getDocumentsForKb(kbId).map((d) =>
          d.id === docId ? { ...d, status, chunk_count, page_count, error_message } : d
        ))
        if (status === 'ready' || status === 'error') {
          clearInterval(pollingRef.current[docId])
          delete pollingRef.current[docId]
        }
      } catch {
        clearInterval(pollingRef.current[docId])
        delete pollingRef.current[docId]
      }
    }, 3000) // poll every 3 seconds
  }

  const handleUpload = async (file) => {
    setUploading(true)
    setUploadProgress(0)

    // Animate progress bar while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p < 90 ? p + 10 : p))
    }, 200)

    try {
      const res = await documentsApi.upload(kbId, file, (pct) => setUploadProgress(pct))
      clearInterval(progressInterval)
      setUploadProgress(100)
      const newDoc = res.data
      addDocument(kbId, newDoc)
      // Auto-start polling for this doc
      startPolling(newDoc.id)
      setActiveTab('documents')
    } catch (err) {
      clearInterval(progressInterval)
      alert(`Upload failed: ${err?.response?.data?.detail || err.message}`)
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 800)
    }
  }

  const handleDeleteDoc = (doc) => {
    setDocToDelete(doc)
    setShowDeleteDocModal(true)
  }

  const handleDeleteDocConfirm = async () => {
    if (!docToDelete) return
    try {
      await documentsApi.delete(kbId, docToDelete.id)
    } catch {
      // proceed anyway
    }
    removeDocument(kbId, docToDelete.id)
    setShowDeleteDocModal(false)
    setDocToDelete(null)
  }

  const documents = getDocumentsForKb(kbId)
  const readyCount = documents.filter((d) => d.status === 'ready').length
  const processingCount = documents.filter((d) =>
    d.status === 'processing' || d.status === 'pending'
  ).length
  const totalChunks = documents.reduce((s, d) => s + (d.chunk_count || 0), 0)

  return (
    <div className="page-container animate-fade-up">
      <button className="btn btn-ghost btn-sm back-btn" onClick={() => navigate('/dashboard')} id="kb-back-btn">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="page-header kb-header">
        <div className="page-header-left">
          <h1 className="page-title">{currentKb?.name || 'Knowledge Base'}</h1>
          <p className="page-subtitle">{currentKb?.description || 'No description'}</p>
        </div>
        <div className="page-header-actions">
          <Link to={`/kb/${kbId}/chat`} className="btn btn-primary" id="kb-open-chat-btn">
            <MessageSquare size={16} /> Open Chat
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="kb-stats">
        <div className="kb-stat-pill"><FileText size={14} /><span>{documents.length} documents</span></div>
        <div className="kb-stat-pill ready"><span className="stat-dot ready" />{readyCount} ready</div>
        {processingCount > 0 && (
          <div className="kb-stat-pill processing"><Clock size={13} />{processingCount} processing</div>
        )}
        <div className="kb-stat-pill"><Layers size={14} />{totalChunks.toLocaleString()} chunks indexed</div>
      </div>

      {/* Tabs */}
      <div className="kb-tabs">
        {['documents', 'upload'].map((tab) => (
          <button
            key={tab}
            className={`kb-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            id={`kb-tab-${tab}`}
          >
            {tab === 'documents' ? <><FileText size={15} /> Documents</> : <><Upload size={15} /> Upload</>}
          </button>
        ))}
      </div>

      {activeTab === 'upload' && (
        <div className="kb-upload-section">
          <DocumentUploader onUpload={handleUpload} uploading={uploading} progress={uploadProgress} />
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="kb-docs-section">
          {documents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FileText size={28} /></div>
              <h3>No documents yet</h3>
              <p>Upload your first document to start building this knowledge base.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('upload')} id="kb-empty-upload-btn">
                <Upload size={16} /> Upload Documents
              </button>
            </div>
          ) : (
            <DocumentList documents={documents} onDelete={handleDeleteDoc} />
          )}
        </div>
      )}

      <Modal isOpen={showDeleteDocModal} onClose={() => setShowDeleteDocModal(false)} title="Delete Document" size="sm">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Delete <strong style={{ color: 'var(--color-text-primary)' }}>{docToDelete?.original_filename}</strong>?
          All its chunks and vectors will be removed.
        </p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowDeleteDocModal(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDeleteDocConfirm} id="confirm-delete-doc-btn">Delete</button>
        </div>
      </Modal>
    </div>
  )
}
