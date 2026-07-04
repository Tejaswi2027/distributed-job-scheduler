import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  register: (email: string, password: string) => api.post('/auth/register', { email, password }),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
};

// Stats
export const statsApi = {
  overview: () => api.get('/stats/overview'),
  logs: () => api.get('/stats/logs'),
};

// Queues
export const queuesApi = {
  listByProject: (projectId: string) => api.get(`/queues/project/${projectId}`),
  create: (data: any) => api.post('/queues', data),
  getStats: (id: string) => api.get(`/queues/${id}/stats`),
  pause: (id: string) => api.post(`/queues/${id}/pause`),
  resume: (id: string) => api.post(`/queues/${id}/resume`),
  delete: (id: string) => api.delete(`/queues/${id}`),
};

// Jobs
export const jobsApi = {
  listByQueue: (queueId: string, limit = 20, offset = 0) =>
    api.get(`/queues/${queueId}/jobs?limit=${limit}&offset=${offset}`),
  enqueue: (data: any) => api.post('/jobs', data),
  getById: (id: string) => api.get(`/jobs/${id}`),
  getLogs: (id: string) => api.get(`/jobs/${id}/logs`),
};

// Workers
export const workersApi = {
  list: () => api.get('/workers'),
};

// DLQ
export const dlqApi = {
  list: (limit = 20, offset = 0) => api.get(`/dlq?limit=${limit}&offset=${offset}`),
  requeue: (id: string) => api.post(`/dlq/${id}/requeue`),
};

// Scheduled Jobs
export const scheduledJobsApi = {
  listByProject: (projectId: string) => api.get(`/scheduled-jobs/project/${projectId}`),
  create: (data: any) => api.post('/scheduled-jobs', data),
  toggle: (id: string) => api.patch(`/scheduled-jobs/${id}/toggle`),
  delete: (id: string) => api.delete(`/scheduled-jobs/${id}`),
};

// Organizations
export const orgsApi = {
  list: () => api.get('/organizations'),
  create: (name: string) => api.post('/organizations', { name }),
  listProjects: (orgId: string) => api.get(`/organizations/${orgId}/projects`),
  createProject: (orgId: string, name: string) => api.post(`/organizations/${orgId}/projects`, { name }),
};
