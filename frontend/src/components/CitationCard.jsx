import { FileText, ExternalLink } from 'lucide-react'
import './CitationCard.css'

export default function CitationCard({ source, index }) {
  const scorePercent = Math.round((source.score || 0) * 100)

  return (
    <div className="citation-card" id={`citation-${source.chunk_id}`}>
      <div className="citation-index">{index}</div>
      <div className="citation-content">
        <div className="citation-header">
          <div className="citation-doc">
            <FileText size={13} />
            <span className="citation-doc-name">{source.doc_name}</span>
            {source.page_number && (
              <span className="citation-page">Page {source.page_number}</span>
            )}
          </div>
          <div className="citation-score" title={`Relevance: ${scorePercent}%`}>
            <div className="citation-score-bar">
              <div className="citation-score-fill" style={{ width: `${scorePercent}%` }} />
            </div>
            <span>{scorePercent}%</span>
          </div>
        </div>
        {source.excerpt && (
          <p className="citation-excerpt">"{source.excerpt}"</p>
        )}
      </div>
    </div>
  )
}
