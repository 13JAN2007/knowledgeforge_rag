import { create } from 'zustand'

export const MOCK_CONVERSATIONS = [
  {
    id: 'conv-001',
    knowledge_base_id: 'kb-001',
    user_id: 'user-001',
    title: 'How does the authentication flow work?',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'conv-002',
    knowledge_base_id: 'kb-001',
    user_id: 'user-001',
    title: 'API rate limits and quotas',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'conv-003',
    knowledge_base_id: 'kb-001',
    user_id: 'user-001',
    title: 'Webhook configuration guide',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
]

export const MOCK_MESSAGES = [
  {
    id: 'msg-001',
    conversation_id: 'conv-003',
    role: 'user',
    content: 'How do I configure webhooks for real-time events?',
    sources: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'msg-002',
    conversation_id: 'conv-003',
    role: 'assistant',
    content: `To configure webhooks for real-time events, follow these steps:\n\n1. **Navigate to Settings → Webhooks** in your dashboard\n2. Click **"Add Endpoint"** and enter your HTTPS URL\n3. Select the event types you want to subscribe to\n4. Copy the **webhook secret** shown — you'll use it to verify payloads\n\nYour endpoint must respond with HTTP 200 within **5 seconds** to be considered successful.\n\nFor payload verification, compute \`HMAC-SHA256\` of the raw request body using your webhook secret.`,
    sources: [
      {
        doc_id: 'doc-001',
        doc_name: 'API Reference v2.pdf',
        page_number: 47,
        chunk_id: 'chunk-abc',
        score: 0.94,
        excerpt: 'Webhooks allow your application to receive real-time HTTP notifications when events occur...',
      },
      {
        doc_id: 'doc-002',
        doc_name: 'User Guide 2024.pdf',
        page_number: 112,
        chunk_id: 'chunk-def',
        score: 0.87,
        excerpt: 'To add a webhook endpoint, navigate to the Integrations section of your account settings...',
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 3.9).toISOString(),
  },
]

export const useChatStore = create((set, get) => ({
  conversations: {},  // keyed by kb_id
  messages: {},       // keyed by conversation_id
  activeConversation: null,
  sending: false,

  getConversationsForKb: (kbId) =>
    get().conversations[kbId] || MOCK_CONVERSATIONS.filter(c => c.knowledge_base_id === kbId || kbId === 'kb-001'),

  getMessages: (convId) =>
    get().messages[convId] || (convId === 'conv-003' ? MOCK_MESSAGES : []),

  setConversations: (kbId, convos) =>
    set((state) => ({ conversations: { ...state.conversations, [kbId]: convos } })),

  setMessages: (convId, msgs) =>
    set((state) => ({ messages: { ...state.messages, [convId]: msgs } })),

  addMessage: (convId, msg) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [convId]: [...(state.messages[convId] || []), msg],
      },
    })),

  setActiveConversation: (conv) => set({ activeConversation: conv }),
  setSending: (sending) => set({ sending }),
}))
