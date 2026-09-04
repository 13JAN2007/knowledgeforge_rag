import { useState } from 'react'
import { Settings, Key, Database, Brain, Zap, Save, CheckCircle } from 'lucide-react'
import './SettingsPage.css'

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState('')
  const [qdrantHost, setQdrantHost] = useState('localhost')
  const [qdrantPort, setQdrantPort] = useState('6333')
  const [embeddingModel, setEmbeddingModel] = useState('all-MiniLM-L6-v2')
  const [chunkSize, setChunkSize] = useState('512')
  const [chunkOverlap, setChunkOverlap] = useState('64')
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="page-container animate-fade-up">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your API keys, models, and RAG pipeline parameters</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings-form">
        {/* API Keys */}
        <div className="settings-section glass-card">
          <div className="settings-section-header">
            <div className="settings-section-icon violet"><Key size={18} /></div>
            <div>
              <h3>API Keys</h3>
              <p>Configure external service credentials</p>
            </div>
          </div>
          <div className="settings-fields">
            <div className="form-group">
              <label className="form-label" htmlFor="gemini-key-input">Gemini API Key</label>
              <input
                id="gemini-key-input"
                className="input"
                type="password"
                placeholder="AIza..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              <p className="field-hint">Get your key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer">aistudio.google.com</a></p>
            </div>
          </div>
        </div>

        {/* Vector DB */}
        <div className="settings-section glass-card">
          <div className="settings-section-header">
            <div className="settings-section-icon cyan"><Database size={18} /></div>
            <div>
              <h3>Qdrant Vector Database</h3>
              <p>Connection settings for your Qdrant instance</p>
            </div>
          </div>
          <div className="settings-fields settings-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="qdrant-host-input">Host</label>
              <input id="qdrant-host-input" className="input" value={qdrantHost} onChange={(e) => setQdrantHost(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="qdrant-port-input">Port</label>
              <input id="qdrant-port-input" className="input" value={qdrantPort} onChange={(e) => setQdrantPort(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Embedding */}
        <div className="settings-section glass-card">
          <div className="settings-section-header">
            <div className="settings-section-icon violet"><Brain size={18} /></div>
            <div>
              <h3>Embedding Model</h3>
              <p>Sentence Transformers model for semantic search</p>
            </div>
          </div>
          <div className="settings-fields">
            <div className="form-group">
              <label className="form-label" htmlFor="embedding-model-select">Model</label>
              <select
                id="embedding-model-select"
                className="input"
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
              >
                <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (384d · fast)</option>
                <option value="all-mpnet-base-v2">all-mpnet-base-v2 (768d · accurate)</option>
                <option value="multi-qa-MiniLM-L6-cos-v1">multi-qa-MiniLM-L6-cos-v1 (384d · QA optimized)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chunking */}
        <div className="settings-section glass-card">
          <div className="settings-section-header">
            <div className="settings-section-icon cyan"><Zap size={18} /></div>
            <div>
              <h3>Chunking Parameters</h3>
              <p>Control how documents are split for indexing</p>
            </div>
          </div>
          <div className="settings-fields settings-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="chunk-size-input">Chunk Size (tokens)</label>
              <input id="chunk-size-input" className="input" type="number" value={chunkSize} onChange={(e) => setChunkSize(e.target.value)} min="128" max="2048" />
              <p className="field-hint">Recommended: 256–1024</p>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="chunk-overlap-input">Overlap (tokens)</label>
              <input id="chunk-overlap-input" className="input" type="number" value={chunkOverlap} onChange={(e) => setChunkOverlap(e.target.value)} min="0" max="512" />
              <p className="field-hint">Recommended: 10–20% of chunk size</p>
            </div>
          </div>
        </div>

        <div className="settings-save-bar">
          <button type="submit" className="btn btn-primary btn-lg" id="settings-save-btn">
            {saved ? <><CheckCircle size={18} /> Saved!</> : <><Save size={18} /> Save Changes</>}
          </button>
          {saved && <span className="save-confirm">Settings saved successfully</span>}
        </div>
      </form>
    </div>
  )
}
