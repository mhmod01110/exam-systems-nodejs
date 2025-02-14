export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
}

export interface Question {
  _id: string;
  text: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: string;
  points: number;
}

export interface Exam {
  _id: string;
  title: string;
  description: string;
  duration: number;
  questions: Question[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  _id: string;
  exam: Exam;
  student: User;
  answers: {
    question: string;
    answer: string;
  }[];
  score: number;
  submittedAt: string;
}

export interface Result {
  _id: string;
  submission: Submission;
  score: number;
  totalPoints: number;
  answers: {
    question: Question;
    answer: string;
    isCorrect: boolean;
    points: number;
  }[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ExamState {
  examList: Exam[];
  currentExam: Exam | null;
  loading: boolean;
  error: string | null;
}

export interface SubmissionState {
  currentSubmission: Submission | null;
  submissionList: Submission[];
  results: Result | null;
  loading: boolean;
  error: string | null;
} 