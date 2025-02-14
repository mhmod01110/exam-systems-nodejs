import apiService, { ApiResponse } from './api';

export interface MCQAnswer {
  questionId: string;
  selectedOption: number;
}

export interface ProjectAnswer {
  questionId: string;
  fileUrl: string;
}

export type Answer = MCQAnswer | ProjectAnswer;

export interface Submission {
  _id: string;
  examId: string;
  studentId: string;
  answers: Answer[];
  score?: number;
  status: 'PENDING' | 'GRADED';
  submittedAt: string;
  gradedAt?: string;
}

export interface CreateSubmissionData {
  examId: string;
  answers: Answer[];
}

class SubmissionService {
  async getSubmissions(): Promise<ApiResponse<Submission[]>> {
    return apiService.get<Submission[]>('/submissions');
  }

  async getSubmissionById(id: string): Promise<ApiResponse<Submission>> {
    return apiService.get<Submission>(`/submissions/${id}`);
  }

  async getSubmissionsByExam(examId: string): Promise<ApiResponse<Submission[]>> {
    return apiService.get<Submission[]>(`/submissions/exam/${examId}`);
  }

  async createSubmission(data: CreateSubmissionData): Promise<ApiResponse<Submission>> {
    return apiService.post<Submission>('/submissions', data);
  }

  async gradeSubmission(id: string, score: number): Promise<ApiResponse<Submission>> {
    return apiService.put<Submission>(`/submissions/${id}/grade`, { score });
  }

  async uploadFile(file: File): Promise<ApiResponse<{ fileUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post<{ fileUrl: string }>('/submissions/upload', formData);
  }
}

export const submissionService = new SubmissionService();
export default submissionService; 