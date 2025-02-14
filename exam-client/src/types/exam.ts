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
  createdBy: string;
  questions: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  isPublic: boolean;
  allowedStudents?: string[];
  shuffleQuestions: boolean;
  showResults: boolean;
  resultReleaseDate?: Date;
  instructions?: string;
  maxAttempts?: number;
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
  isPublic: boolean;
  allowedStudents?: string[];
  shuffleQuestions: boolean;
  showResults: boolean;
  resultReleaseDate?: Date;
  instructions?: string;
  maxAttempts?: number;
}

export interface UpdateExamData {
  title?: string;
  description?: string;
  type?: 'MCQ' | 'PROJECT' | 'MIXED';
  duration?: number;
  startDate?: Date;
  endDate?: Date;
  totalMarks?: number;
  passingMarks?: number;
  department?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  isPublic?: boolean;
  allowedStudents?: string[];
  shuffleQuestions?: boolean;
  showResults?: boolean;
  resultReleaseDate?: Date;
  instructions?: string;
  maxAttempts?: number;
}

export interface ExamState {
  exams: Exam[];
  currentExam: Exam | null;
  loading: boolean;
  error: string | null;
} 