import apiService, { ApiResponse } from './api';

export interface Question {
  _id: string;
  questionText: string;
  type: 'MCQ' | 'PROJECT';
  marks: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  options?: Array<{
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
  projectRequirements?: string;
  submissionFormat?: 'ZIP' | 'PDF' | 'DOC' | 'OTHER';
  maxFileSize?: number;
  allowedFileExtensions?: string[];
  explanation?: string;
  hints?: string[];
  images?: Array<{
    url: string;
    caption: string;
  }>;
  isActive: boolean;
}

export interface Exam {
  _id: string;
  title: string;
  description?: string;
  type: 'MCQ' | 'PROJECT' | 'MIXED';
  duration: number;
  startDate: Date;
  endDate: Date;
  totalMarks: number;
  passingMarks: number;
  department: string;
  status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  isPublic: boolean;
  allowedStudents?: string[];
  questions: Question[];
  shuffleQuestions: boolean;
  showResults: boolean;
  resultReleaseDate?: Date;
  instructions?: string;
  maxAttempts: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExamData {
  title: string;
  description?: string;
  type: 'MCQ' | 'PROJECT' | 'MIXED';
  duration: number;
  startDate: Date;
  endDate: Date;
  totalMarks: number;
  passingMarks: number;
  department: string;
  isPublic?: boolean;
  shuffleQuestions?: boolean;
  showResults?: boolean;
  resultReleaseDate?: Date;
  instructions?: string;
  maxAttempts?: number;
}

export interface UpdateExamData extends Partial<CreateExamData> {
  status?: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  allowedStudents?: string[];
}

class ExamService {
  async getExams(): Promise<ApiResponse<Exam[]>> {
    return apiService.get<Exam[]>('/exams');
  }

  async getExamById(id: string): Promise<ApiResponse<Exam>> {
    return apiService.get<Exam>(`/exams/${id}`);
  }

  async createExam(data: CreateExamData): Promise<ApiResponse<Exam>> {
    return apiService.post<Exam>('/exams', data);
  }

  async updateExam(id: string, data: UpdateExamData): Promise<ApiResponse<Exam>> {
    return apiService.put<Exam>(`/exams/${id}`, data);
  }

  async deleteExam(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/exams/${id}`);
  }

  async addQuestionToExam(examId: string, questionId: string): Promise<ApiResponse<Exam>> {
    return apiService.post<Exam>(`/exams/${examId}/questions`, { questionId });
  }

  async removeQuestionFromExam(examId: string, questionId: string): Promise<ApiResponse<Exam>> {
    return apiService.delete<Exam>(`/exams/${examId}/questions/${questionId}`);
  }
}

export const examService = new ExamService();
export default examService; 