import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import examReducer from './slices/examSlice';
import questionReducer from './slices/questionSlice';
import submissionReducer from './slices/submissionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exam: examReducer,
    question: questionReducer,
    submission: submissionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 