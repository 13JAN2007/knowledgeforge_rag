import { useNavigate } from 'react-router-dom'
import { Brain, Zap, Search, Shield, ChevronRight, BookOpen, Layers, MessageSquare, Star } from 'lucide-react'
import './LandingPage.css'

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Multi-Document Ingestion',
    desc: 'Upload PDFs, Word docs, TXT, and CSV files. We handle extraction, chunking, and indexing automatically.',
    color: 'violet',
  },
  {
    icon: Layers,
    title: 'Advanced RAG Pipeline',
    desc: 'Semantic search with Sentence Transformers and Qdrant retrieves the most relevant context for every query.',
    color: 'cyan',
  },
  {
    icon: MessageSquare,
    title: 'Gemini-Powered Chat',
    desc: 'Grounded answers from Gemini with precise citations — document name, page number, and relevance score.',
    color: 'violet',
  },
  {
    icon: Zap,
    title: 'Real-Time Processing',
    desc: 'Asynchronous pipeline processes documents in the background. Chat while new content is being indexed.',
    color: 'cyan',
  },
  {
    icon: Search,
    title: 'Intelligent Retrieval',
    desc: 'Vector similarity search finds semantically related chunks, not just keyword matches.',
    color: 'violet',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'Your documents stay in your own infrastructure. PostgreSQL + Qdrant running on your servers.',
    color: 'cyan',
  },
]

const STATS = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '< 200ms', label: 'Avg Query Time' },
  { value: '50MB', label: 'Max File Size' },
  { value: '∞', label: 'Knowledge Bases' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <div className="landing-logo-icon"><Brain size={20} /></div>
          <span>KnowledgeForge <strong>AI</strong></span>
        </div>
        <div className="landing-nav-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} id="landing-login-btn">
            Sign In
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')} id="landing-cta-btn">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />
        <div className="landing-container">
          <div className="hero-badge animate-fade-up">
            <Zap size={12} />
            Powered by Gemini 1.5 Flash + Qdrant
          </div>
          <h1 className="hero-title animate-fade-up">
            Chat with your<br />
            <span className="hero-title-accent">documents</span>,<br />
            intelligently.
          </h1>
          <p className="hero-subtitle animate-fade-up">
            KnowledgeForge AI is a production-grade RAG platform. Upload any documents,
            ask natural language questions, and get precise, cited answers — powered by
            state-of-the-art semantic search and generative AI.
          </p>
          <div className="hero-actions animate-fade-up">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')} id="hero-start-btn">
              Start Building <ChevronRight size={18} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/dashboard')} id="hero-demo-btn">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="landing-stats">
        <div className="landing-container">
          <div className="stats-grid">
            {STATS.map((s) => (
              <div className="stat-item glass-card" key={s.label}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-container">
          <div className="section-header">
            <h2>Everything you need for<br /><span className="text-accent">enterprise RAG</span></h2>
            <p>A complete pipeline from document upload to grounded AI answers.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div className={`feature-card glass-card feature-${f.color}`} key={f.title}>
                  <div className={`feature-icon feature-icon-${f.color}`}>
                    <Icon size={22} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-container">
          <div className="cta-card glass-card">
            <div className="cta-glow" />
            <h2>Ready to unlock your documents?</h2>
            <p>Create your first knowledge base in minutes. No credit card required.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')} id="cta-final-btn">
              Get Started for Free <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-logo">
            <div className="landing-logo-icon"><Brain size={16} /></div>
            <span>KnowledgeForge AI</span>
          </div>
          <p>Built with FastAPI · React · PostgreSQL · Qdrant · Gemini</p>
        </div>
      </footer>
    </div>
  )
}
