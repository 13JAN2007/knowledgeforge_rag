import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Modal from './components/Modal'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import ChatPage from './pages/ChatPage'
import ConversationsPage from './pages/ConversationsPage'
import SettingsPage from './pages/SettingsPage'
import { useKnowledgeBaseStore } from './store/knowledgeBaseStore'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

function AppShell() {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)
  const { createKnowledgeBase } = useKnowledgeBaseStore()

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

  return (
    <div className="app-shell">
      <Sidebar onCreateKb={() => setShowCreateModal(true)} />
      <div className="main-content">
        <Navbar />
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/kb/:kbId" element={<KnowledgeBasePage />} />
          <Route path="/kb/:kbId/chat" element={<ChatPage />} />
          <Route path="/kb/:kbId/conversations" element={<ConversationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Knowledge Base" size="sm">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label" htmlFor="shell-kb-name">Name *</label>
            <input id="shell-kb-name" className="input" placeholder="e.g., Product Documentation" value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} autoFocus required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="shell-kb-desc">Description</label>
            <textarea id="shell-kb-desc" className="input textarea" rows={3} placeholder="What kind of documents will this contain?"
              value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!createForm.name.trim() || creating} id="shell-create-kb-submit">
              {creating ? <span className="spinner" /> : <Plus size={16} />}
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  )
}
