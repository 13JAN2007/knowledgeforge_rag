import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, MessageSquare, BookOpen } from 'lucide-react'
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore'
import { useChatStore } from '../store/chatStore'
import { conversationsApi, chatApi } from '../api/conversations'
import ChatInterface from '../components/ChatInterface'
import './ChatPage.css'

export default function ChatPage() {
  const { kbId } = useParams()
  const navigate = useNavigate()
  const { currentKb, fetchKnowledgeBase } = useKnowledgeBaseStore()
  const {
    getConversationsForKb,
    getMessages,
    activeConversation,
    setActiveConversation,
    addMessage,
    setSending,
    sending,
    setMessages,
    setConversations,
  } = useChatStore()

  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    fetchKnowledgeBase(kbId)
    loadConversations()
  }, [kbId])

  const conversations = getConversationsForKb(kbId)

  const loadConversations = async () => {
    try {
      const res = await conversationsApi.list(kbId)
      if (res.data?.items?.length > 0) {
        setConversations(kbId, res.data.items)
        if (!activeConversation) {
          setActiveConversation(res.data.items[0])
          await loadMessages(res.data.items[0].id)
        }
      }
    } catch {
      // Fall back to mock data (backend not running)
    }
  }

  const loadMessages = async (convId) => {
    setLoadingMessages(true)
    try {
      const res = await chatApi.getMessages(convId)
      setMessages(convId, res.data || [])
    } catch {
      // keep existing mock messages
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSelectConversation = async (conv) => {
    setActiveConversation(conv)
    await loadMessages(conv.id)
  }

  const handleNewConversation = async () => {
    try {
      const res = await conversationsApi.create(kbId, { title: 'New Conversation' })
      const newConv = res.data
      setConversations(kbId, [newConv, ...conversations])
      setActiveConversation(newConv)
      setMessages(newConv.id, [])
    } catch {
      // Mock fallback
      const newConv = {
        id: `conv-${Date.now()}`,
        knowledge_base_id: kbId,
        user_id: 'user-001',
        title: 'New Conversation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setActiveConversation(newConv)
      setMessages(newConv.id, [])
    }
  }

  const handleSend = async (text) => {
    if (!activeConversation) return
    const convId = activeConversation.id

    // Optimistically add user message to UI
    const userMsg = {
      id: `msg-${Date.now()}`,
      conversation_id: convId,
      role: 'user',
      content: text,
      sources: null,
      created_at: new Date().toISOString(),
    }
    addMessage(convId, userMsg)
    setSending(true)

    try {
      // Call real backend RAG pipeline
      const res = await chatApi.sendMessage({
        conversation_id: convId,
        question: text,
        top_k: 5,
      })
      addMessage(convId, res.data.message)
    } catch (err) {
      // Show error message in chat
      const errorMsg = {
        id: `msg-err-${Date.now()}`,
        conversation_id: convId,
        role: 'assistant',
        content: `⚠️ Could not reach the backend. Make sure the FastAPI server is running at \`http://localhost:8000\`.\n\nError: ${err?.response?.data?.detail || err.message}`,
        sources: null,
        created_at: new Date().toISOString(),
      }
      addMessage(convId, errorMsg)
    } finally {
      setSending(false)
    }
  }

  const messages = activeConversation ? getMessages(activeConversation.id) : []

  return (
    <div className="chat-page">
      {/* Conversation sidebar */}
      <div className="chat-conv-sidebar">
        <div className="conv-sidebar-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/kb/${kbId}`)} id="chat-back-btn">
            <ArrowLeft size={15} />
          </button>
          <div className="conv-kb-name">
            <BookOpen size={14} />
            <span>{currentKb?.name || 'Knowledge Base'}</span>
          </div>
          <button
            className="btn btn-icon btn-ghost"
            onClick={handleNewConversation}
            id="chat-new-conv-btn"
            data-tooltip="New conversation"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="conv-list">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className={`conv-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
              onClick={() => handleSelectConversation(conv)}
              id={`conv-item-${conv.id}`}
            >
              <MessageSquare size={14} className="conv-icon" />
              <span className="conv-title">{conv.title}</span>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="conv-empty">
              <p>No conversations yet</p>
              <button className="btn btn-secondary btn-sm" onClick={handleNewConversation}>
                Start one
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-main">
        {activeConversation ? (
          <ChatInterface
            messages={messages}
            onSend={handleSend}
            sending={sending}
            kbName={currentKb?.name}
          />
        ) : (
          <div className="chat-no-conv">
            <MessageSquare size={40} />
            <h3>Select a conversation</h3>
            <p>Or start a new one to begin chatting</p>
            <button className="btn btn-primary" onClick={handleNewConversation} id="chat-start-btn">
              New Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
