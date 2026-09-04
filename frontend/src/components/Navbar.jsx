import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Bell, Search, MessageSquare } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const getBreadcrumb = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Dashboard'
    if (path.includes('/chat')) return 'Chat'
    if (path.includes('/conversations')) return 'Conversations'
    if (path.includes('/kb/')) return 'Knowledge Base'
    if (path === '/settings') return 'Settings'
    return 'KnowledgeForge AI'
  }

  return (
    <header className="navbar">
      <div className="navbar-breadcrumb">
        <span className="navbar-page">{getBreadcrumb()}</span>
      </div>

      <div className="navbar-search">
        <Search size={15} className="navbar-search-icon" />
        <input
          className="navbar-search-input"
          placeholder="Search knowledge bases, documents..."
          id="navbar-search"
        />
        <kbd className="navbar-kbd">⌘K</kbd>
      </div>

      <div className="navbar-actions">
        <button className="btn btn-icon btn-ghost" id="navbar-notifications" data-tooltip="Notifications">
          <Bell size={18} />
        </button>
        <div className="navbar-avatar" id="navbar-user-avatar">
          <span>A</span>
        </div>
      </div>
    </header>
  )
}
