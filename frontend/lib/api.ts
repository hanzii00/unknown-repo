import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/users/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          error.config.headers.Authorization = `Bearer ${data.access}`;
          return api.request(error.config);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const register = (data: { username: string; email: string; password: string }) =>
  api.post('/users/register/', data);
export const login = (data: { username: string; password: string }) =>
  api.post('/users/login/', data);
export const getMe = () => api.get('/users/me/');
export const getUser = (username: string) => api.get(`/users/${username}/`);
export const followUser = (username: string) => api.post(`/users/${username}/follow/`);
export const searchUsers = (q: string) => api.get(`/users/search/?q=${q}`);

// Repos
export const getUserRepos = (username: string) => api.get(`/repos/${username}/`);
export const getRepo = (username: string, name: string) => api.get(`/repos/${username}/${name}/`);
export const createRepo = (username: string, data: object) => api.post(`/repos/${username}/`, data);
export const starRepo = (username: string, name: string) =>
  api.post(`/repos/${username}/${name}/star/`);
export const exploreRepos = (params?: { q?: string; language?: string }) =>
  api.get('/repos/explore/', { params });

// Issues
export const getIssues = (username: string, repo: string, state = 'open') =>
  api.get(`/repos/${username}/${repo}/issues/?state=${state}`);
export const getIssue = (username: string, repo: string, number: number) =>
  api.get(`/repos/${username}/${repo}/issues/${number}/`);
export const createIssue = (username: string, repo: string, data: object) =>
  api.post(`/repos/${username}/${repo}/issues/`, data);
export const getComments = (username: string, repo: string, number: number) =>
  api.get(`/repos/${username}/${repo}/issues/${number}/comments/`);
export const createComment = (username: string, repo: string, number: number, body: string) =>
  api.post(`/repos/${username}/${repo}/issues/${number}/comments/`, { body });

// Files
export const getRepoFiles = (username: string, repo: string, branch = 'main') =>
  api.get(`/repos/${username}/${repo}/files/?branch=${branch}`);
export const uploadFile = (username: string, repo: string, file: File, path: string, branch = 'main') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);
  formData.append('branch', branch);
  return api.post(`/repos/${username}/${repo}/files/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteFile = (username: string, repo: string, fileId: number) =>
  api.delete(`/repos/${username}/${repo}/files/${fileId}/`);