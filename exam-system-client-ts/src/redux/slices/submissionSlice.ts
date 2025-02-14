import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { submissions, results } from '../../services/api';
import { SubmissionState } from '../../types';

interface SubmitExamPayload {
  examId: string;
  submissionData: {
    answers: {
      question: string;
      answer: string;
    }[];
  };
}

// Async thunks
export const submitExam = createAsyncThunk(
  'submission/submitExam',
  async ({ examId, submissionData }: SubmitExamPayload, { rejectWithValue }) => {
    try {
      const response = await submissions.submit(examId, submissionData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit exam');
    }
  }
);

export const fetchSubmissionsByExam = createAsyncThunk(
  'submission/fetchByExam',
  async (examId: string, { rejectWithValue }) => {
    try {
      const response = await submissions.getByExam(examId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch submissions');
    }
  }
);

export const fetchSubmissionResults = createAsyncThunk(
  'submission/fetchResults',
  async (submissionId: string, { rejectWithValue }) => {
    try {
      const response = await results.getBySubmission(submissionId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch results');
    }
  }
);

const initialState: SubmissionState = {
  currentSubmission: null,
  submissionList: [],
  results: null,
  loading: false,
  error: null,
};

const submissionSlice = createSlice({
  name: 'submission',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentSubmission: (state) => {
      state.currentSubmission = null;
    },
    clearResults: (state) => {
      state.results = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit exam cases
      .addCase(submitExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitExam.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubmission = action.payload;
        state.submissionList.push(action.payload);
      })
      .addCase(submitExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch submissions by exam cases
      .addCase(fetchSubmissionsByExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionsByExam.fulfilled, (state, action) => {
        state.loading = false;
        state.submissionList = action.payload;
      })
      .addCase(fetchSubmissionsByExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch submission results cases
      .addCase(fetchSubmissionResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(fetchSubmissionResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentSubmission, clearResults } = submissionSlice.actions;
export default submissionSlice.reducer; 