import { create } from 'zustand'

export const MOCK_DOCS = [
  {
    id: 'doc-001',
    knowledge_base_id: 'kb-001',
    filename: 'api_reference_v2.pdf',
    original_filename: 'API Reference v2.pdf',
    file_type: 'pdf',
    file_size_bytes: 2048000,
    status: 'ready',
    error_message: null,
    page_count: 145,
    chunk_count: 320,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'doc-002',
    knowledge_base_id: 'kb-001',
    filename: 'user_guide_2024.pdf',
    original_filename: 'User Guide 2024.pdf',
    file_type: 'pdf',
    file_size_bytes: 5242880,
    status: 'ready',
    error_message: null,
    page_count: 280,
    chunk_count: 640,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'doc-003',
    knowledge_base_id: 'kb-001',
    filename: 'release_notes.txt',
    original_filename: 'Release Notes Q3 2024.txt',
    file_type: 'txt',
    file_size_bytes: 48000,
    status: 'processing',
    error_message: null,
    page_count: 0,
    chunk_count: 0,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'doc-004',
    knowledge_base_id: 'kb-001',
    filename: 'changelog.csv',
    original_filename: 'Changelog.csv',
    file_type: 'csv',
    file_size_bytes: 24000,
    status: 'pending',
    error_message: null,
    page_count: 0,
    chunk_count: 0,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const useDocumentStore = create((set, get) => ({
  documents: {},  // keyed by kb_id
  uploading: false,
  uploadProgress: 0,

  getDocumentsForKb: (kbId) => get().documents[kbId] || MOCK_DOCS.filter(d => d.knowledge_base_id === kbId || kbId === 'kb-001'),

  setDocuments: (kbId, docs) =>
    set((state) => ({ documents: { ...state.documents, [kbId]: docs } })),

  addDocument: (kbId, doc) =>
    set((state) => ({
      documents: {
        ...state.documents,
        [kbId]: [doc, ...(state.documents[kbId] || [])],
      },
    })),

  removeDocument: (kbId, docId) =>
    set((state) => ({
      documents: {
        ...state.documents,
        [kbId]: (state.documents[kbId] || []).filter((d) => d.id !== docId),
      },
    })),

  setUploading: (uploading) => set({ uploading }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
}))
