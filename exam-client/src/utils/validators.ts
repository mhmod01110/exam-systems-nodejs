import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = yup.object().shape({
  username: yup.string().required('Username is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export const examSchema = yup.object().shape({
  title: yup.string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: yup.string()
    .max(500, 'Description cannot exceed 500 characters'),
  type: yup.string()
    .oneOf(['MCQ', 'PROJECT', 'MIXED'], 'Invalid exam type')
    .required('Exam type is required'),
  duration: yup.number()
    .required('Duration is required')
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration cannot exceed 8 hours'),
  startDate: yup.date()
    .required('Start date is required')
    .min(new Date(), 'Start date must be in the future'),
  endDate: yup.date()
    .required('End date is required')
    .min(yup.ref('startDate'), 'End date must be after start date'),
  totalMarks: yup.number()
    .required('Total marks is required')
    .min(1, 'Total marks must be at least 1'),
  passingMarks: yup.number()
    .required('Passing marks is required')
    .min(1, 'Passing marks must be at least 1')
    .max(yup.ref('totalMarks'), 'Passing marks cannot exceed total marks'),
  department: yup.string()
    .required('Department is required')
    .trim(),
  isPublic: yup.boolean(),
  shuffleQuestions: yup.boolean(),
  showResults: yup.boolean(),
  resultReleaseDate: yup.date()
    .min(yup.ref('endDate'), 'Result release date must be after end date'),
  instructions: yup.string()
    .trim(),
  maxAttempts: yup.number()
    .min(1, 'Maximum attempts must be at least 1'),
});

export const questionSchema = yup.object().shape({
  text: yup.string().required('Question text is required'),
  type: yup.string().required('Question type is required').oneOf(['MCQ', 'PROJECT'], 'Invalid question type'),
  marks: yup.number().required('Marks is required').positive('Marks must be positive'),
  options: yup.array().when('type', {
    is: 'MCQ',
    then: yup.array().of(yup.string()).min(2, 'At least 2 options are required').required('Options are required'),
    otherwise: yup.array().notRequired(),
  }),
  correctOption: yup.number().when('type', {
    is: 'MCQ',
    then: yup.number().required('Correct option is required').min(0, 'Invalid option'),
    otherwise: yup.number().notRequired(),
  }),
}); 