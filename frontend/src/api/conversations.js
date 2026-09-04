import api from './client'

export const conversationsApi = {
  list: (kbId) => api.get(`/knowledge-bases/${kbId}/conversations`),
  get: (kbId, convId) => api.get(`/knowledge-bases/${kbId}/conversations/${convId}`),
  create: (kbId, data = {}) => api.post(`/knowledge-bases/${kbId}/conversations`, data),
  update: (kbId, convId, data) => api.patch(`/knowledge-bases/${kbId}/conversations/${convId}`, data),
  delete: (kbId, convId) => api.delete(`/knowledge-bases/${kbId}/conversations/${convId}`),
}

export const chatApi = {
  sendMessage: (data) => api.post('/chat', data),
  getMessages: (conversationId) => api.get(`/chat/${conversationId}/messages`),
}
