import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import CitationCard from './CitationCard'
import './ChatInterface.css'

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'} animate-fade-up`}>
      <div className="chat-message-avatar">
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="chat-message-content">
        <div className="chat-message-bubble">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="chat-message-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {message.sources?.length > 0 && (
          <div className="chat-message-sources">
            <div className="sources-label">
              <Sparkles size={12} />
              Sources ({message.sources.length})
            </div>
            <div className="sources-list">
              {message.sources.map((src, i) => (
                <CitationCard key={i} source={src} index={i + 1} />
              ))}
            </div>
          </div>
        )}
        <div className="chat-message-time">{formatTime(message.created_at)}</div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="chat-message assistant animate-fade-up">
      <div className="chat-message-avatar">
        <Bot size={16} />
      </div>
      <div className="chat-message-content">
        <div className="chat-message-bubble typing">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}

export default function ChatInterface({ messages, onSend, sending, kbName }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = () => {
    const text = input.trim()
    if (!text || sending) return
    onSend?.(text)
    setInput('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestions = [
    'Summarize the key points from the documents',
    'What are the main topics covered?',
    'Find all mentions of pricing or costs',
  ]

  return (
    <div className="chat-interface">
      {/* Messages area */}
      <div className="chat-messages" id="chat-messages-area">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <Bot size={32} />
            </div>
            <h3>Chat with {kbName || 'your knowledge base'}</h3>
            <p>Ask anything about the documents in this knowledge base.</p>
            <div className="chat-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="chat-suggestion"
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  id={`chat-suggestion-${i}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {sending && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask a question about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            id="chat-message-input"
            disabled={sending}
          />
          <button
            className={`chat-send-btn ${input.trim() && !sending ? 'active' : ''}`}
            onClick={handleSend}
            disabled={!input.trim() || sending}
            id="chat-send-btn"
          >
            {sending ? <Loader size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="chat-input-hint">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
