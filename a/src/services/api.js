import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

// Exam endpoints
export const exams = {
  getAll: () => api.get('/exams'),
  getById: (id) => api.get(`/exams/${id}`),
  create: (examData) => api.post('/exams', examData),
  update: (id, examData) => api.put(`/exams/${id}`, examData),
  delete: (id) => api.delete(`/exams/${id}`),
};

// Question endpoints
export const questions = {
  create: (examId, questionData) => api.post(`/exams/${examId}/questions`, questionData),
  update: (examId, questionId, questionData) =>
    api.put(`/exams/${examId}/questions/${questionId}`, questionData),
  delete: (examId, questionId) =>
    api.delete(`/exams/${examId}/questions/${questionId}`),
};

// Submission endpoints
export const submissions = {
  submit: (examId, submissionData) =>
    api.post(`/exams/${examId}/submissions`, submissionData),
  getByExam: (examId) => api.get(`/exams/${examId}/submissions`),
  getById: (examId, submissionId) =>
    api.get(`/exams/${examId}/submissions/${submissionId}`),
};

// Results endpoints
export const results = {
  getBySubmission: (submissionId) => api.get(`/submissions/${submissionId}/results`),
  getByExam: (examId) => api.get(`/exams/${examId}/results`),
};

export default api;
