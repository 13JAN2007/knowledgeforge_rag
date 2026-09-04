import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Brain, LayoutDashboard, Settings, ChevronLeft, ChevronRight,
  Plus, BookOpen, MessagesSquare, FolderOpen
} from 'lucide-react'
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore'
import './Sidebar.css'

export default function Sidebar({ onCreateKb }) {
  const [collapsed, setCollapsed] = useState(false)
  const { knowledgeBases } = useKnowledgeBaseStore()
  const navigate = useNavigate()

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Brain size={22} />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">KnowledgeForge</span>
            <span className="sidebar-logo-tag">AI</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">{!collapsed && 'Navigation'}</div>
        <NavLink to="/dashboard" className="sidebar-link" id="nav-dashboard">
          <LayoutDashboard size={18} />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>
        <NavLink to="/settings" className="sidebar-link" id="nav-settings">
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </nav>

      {/* Knowledge Bases */}
      <div className="sidebar-kbs">
        <div className="sidebar-kbs-header">
          {!collapsed && <span className="sidebar-section-label">Knowledge Bases</span>}
          <button
            className="btn btn-icon btn-ghost sidebar-add-btn"
            onClick={onCreateKb}
            id="sidebar-create-kb-btn"
            data-tooltip={collapsed ? 'New Knowledge Base' : undefined}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="sidebar-kb-list">
          {knowledgeBases.slice(0, 8).map((kb) => (
            <NavLink
              key={kb.id}
              to={`/kb/${kb.id}`}
              className="sidebar-kb-item"
              id={`sidebar-kb-${kb.id}`}
            >
              <div className="sidebar-kb-icon">
                <BookOpen size={14} />
              </div>
              {!collapsed && (
                <div className="sidebar-kb-info">
                  <span className="sidebar-kb-name">{kb.name}</span>
                  <span className="sidebar-kb-meta">{kb.document_count} docs</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        className="sidebar-collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        id="sidebar-collapse-btn"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
