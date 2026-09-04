import api from './client'

export const knowledgeBasesApi = {
  list: (params = {}) => api.get('/knowledge-bases', { params }),
  get: (id) => api.get(`/knowledge-bases/${id}`),
  create: (data) => api.post('/knowledge-bases', data),
  update: (id, data) => api.patch(`/knowledge-bases/${id}`, data),
  delete: (id) => api.delete(`/knowledge-bases/${id}`),
}
