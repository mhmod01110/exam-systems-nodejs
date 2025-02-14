import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import examReducer from './slices/examSlice';
import submissionReducer from './slices/submissionSlice';

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

export default store;
