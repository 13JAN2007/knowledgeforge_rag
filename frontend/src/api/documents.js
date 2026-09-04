import api from './client'

export const documentsApi = {
  list: (kbId) => api.get(`/knowledge-bases/${kbId}/documents`),
  get: (kbId, docId) => api.get(`/knowledge-bases/${kbId}/documents/${docId}`),
  getStatus: (kbId, docId) => api.get(`/knowledge-bases/${kbId}/documents/${docId}/status`),
  upload: (kbId, file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/knowledge-bases/${kbId}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    })
  },
  delete: (kbId, docId) => api.delete(`/knowledge-bases/${kbId}/documents/${docId}`),
}
