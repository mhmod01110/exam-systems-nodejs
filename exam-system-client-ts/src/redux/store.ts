import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import examReducer from './slices/examSlice';
import submissionReducer from './slices/submissionSlice';
import { AuthState, ExamState, SubmissionState } from '../types';

export interface RootState {
  auth: AuthState;
  exam: ExamState;
  submission: SubmissionState;
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exam: examReducer,
    submission: submissionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type AppDispatch = typeof store.dispatch; 