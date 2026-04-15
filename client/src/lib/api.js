import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Track client ID for WebSocket correlation
const clientId = crypto.randomUUID();
export { clientId };

// Request interceptor — attach client ID
api.interceptors.request.use((config) => {
  config.headers['x-client-id'] = clientId;
  return config;
});

// Response interceptor — normalise errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

/* ─── Transcripts ─────────────────────────────────────────────────── */

export async function fetchTranscripts({ search = '', status = '', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  params.set('page', page);
  params.set('limit', limit);
  const { data } = await api.get(`/transcripts?${params}`);
  return data;
}

export async function fetchTranscript(id) {
  const { data } = await api.get(`/transcripts/${id}`);
  return data;
}

export async function uploadAndTranscribe(file, title, onUploadProgress) {
  const formData = new FormData();
  formData.append('audio', file);
  if (title) formData.append('title', title);
  const { data } = await api.post('/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return data;
}

export async function updateTranscript(id, payload) {
  const { data } = await api.patch(`/transcripts/${id}`, payload);
  return data;
}

export async function deleteTranscript(id) {
  const { data } = await api.delete(`/transcripts/${id}`);
  return data;
}

export default api;
