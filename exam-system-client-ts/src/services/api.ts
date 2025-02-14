import axios, { AxiosInstance } from 'axios';
import { User, Exam, Submission, Result } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
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

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
}

// Auth endpoints
export const auth = {
  login: (credentials: { email: string; password: string }) =>
    api.post<LoginResponse>('/auth/login', credentials),
  register: (userData: RegisterData) =>
    api.post<LoginResponse>('/auth/register', userData),
  getProfile: () => api.get<User>('/auth/profile'),
};

// Exam endpoints
export const exams = {
  getAll: () => api.get<Exam[]>('/exams'),
  getById: (id: string) => api.get<Exam>(`/exams/${id}`),
  create: (examData: Partial<Exam>) => api.post<Exam>('/exams', examData),
  update: (id: string, examData: Partial<Exam>) =>
    api.put<Exam>(`/exams/${id}`, examData),
  delete: (id: string) => api.delete(`/exams/${id}`),
};

// Question endpoints
export const questions = {
  create: (examId: string, questionData: Partial<Question>) =>
    api.post<Question>(`/exams/${examId}/questions`, questionData),
  update: (examId: string, questionId: string, questionData: Partial<Question>) =>
    api.put<Question>(`/exams/${examId}/questions/${questionId}`, questionData),
  delete: (examId: string, questionId: string) =>
    api.delete(`/exams/${examId}/questions/${questionId}`),
};

// Submission endpoints
interface SubmitData {
  answers: {
    question: string;
    answer: string;
  }[];
}

export const submissions = {
  submit: (examId: string, submissionData: SubmitData) =>
    api.post<Submission>(`/exams/${examId}/submissions`, submissionData),
  getByExam: (examId: string) =>
    api.get<Submission[]>(`/exams/${examId}/submissions`),
  getById: (examId: string, submissionId: string) =>
    api.get<Submission>(`/exams/${examId}/submissions/${submissionId}`),
};

// Results endpoints
export const results = {
  getBySubmission: (submissionId: string) =>
    api.get<Result>(`/submissions/${submissionId}/results`),
  getByExam: (examId: string) => api.get<Result[]>(`/exams/${examId}/results`),
};

export default api; 