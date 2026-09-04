import { create } from 'zustand'
import { knowledgeBasesApi } from '../api/knowledgeBases'

// ── Mock data for placeholder UI ──────────────────────────────────────────
export const MOCK_KBS = [
  {
    id: 'kb-001',
    user_id: 'user-001',
    name: 'Product Documentation',
    description: 'All product manuals, API docs, and release notes for our platform.',
    document_count: 12,
    chunk_count: 2480,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'kb-002',
    user_id: 'user-001',
    name: 'Research Papers',
    description: 'Machine learning and AI research papers for literature review.',
    document_count: 34,
    chunk_count: 8920,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 0.5).toISOString(),
  },
  {
    id: 'kb-003',
    user_id: 'user-001',
    name: 'Company Policies',
    description: 'HR policies, compliance documents, and internal guidelines.',
    document_count: 8,
    chunk_count: 1250,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const useKnowledgeBaseStore = create((set, get) => ({
  knowledgeBases: MOCK_KBS,
  currentKb: null,
  loading: false,
  error: null,

  setKnowledgeBases: (kbs) => set({ knowledgeBases: kbs }),

  fetchKnowledgeBases: async () => {
    set({ loading: true, error: null })
    try {
      const res = await knowledgeBasesApi.list()
      const items = res.data?.items?.length > 0 ? res.data.items : MOCK_KBS
      set({ knowledgeBases: items, loading: false })
    } catch {
      // Fallback to mock data if backend not available
      set({ knowledgeBases: MOCK_KBS, loading: false })
    }
  },

  fetchKnowledgeBase: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await knowledgeBasesApi.get(id)
      set({ currentKb: res.data, loading: false })
    } catch {
      const mock = MOCK_KBS.find((kb) => kb.id === id) || MOCK_KBS[0]
      set({ currentKb: mock, loading: false })
    }
  },

  createKnowledgeBase: async (data) => {
    try {
      const res = await knowledgeBasesApi.create(data)
      const newKb = res.data
      set((state) => ({ knowledgeBases: [newKb, ...state.knowledgeBases] }))
      return newKb
    } catch {
      // Mock create
      const newKb = {
        id: `kb-${Date.now()}`,
        user_id: 'user-001',
        ...data,
        document_count: 0,
        chunk_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      set((state) => ({ knowledgeBases: [newKb, ...state.knowledgeBases] }))
      return newKb
    }
  },

  deleteKnowledgeBase: async (id) => {
    try {
      await knowledgeBasesApi.delete(id)
    } catch {
      // proceed anyway in mock mode
    }
    set((state) => ({
      knowledgeBases: state.knowledgeBases.filter((kb) => kb.id !== id),
    }))
  },
}))
