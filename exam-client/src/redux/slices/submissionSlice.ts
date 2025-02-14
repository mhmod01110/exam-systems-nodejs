import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { submissionService, Submission, CreateSubmissionData } from '@/services/submissionService';

interface SubmissionState {
  submissions: Submission[];
  currentSubmission: Submission | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubmissionState = {
  submissions: [],
  currentSubmission: null,
  loading: false,
  error: null,
};

export const fetchSubmissions = createAsyncThunk(
  'submission/fetchSubmissions',
  async () => {
    const response = await submissionService.getSubmissions();
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch submissions');
    }
    return response.data!;
  }
);

export const fetchSubmissionById = createAsyncThunk(
  'submission/fetchSubmissionById',
  async (id: string) => {
    const response = await submissionService.getSubmissionById(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch submission');
    }
    return response.data!;
  }
);

export const fetchSubmissionsByExam = createAsyncThunk(
  'submission/fetchSubmissionsByExam',
  async (examId: string) => {
    const response = await submissionService.getSubmissionsByExam(examId);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch submissions');
    }
    return response.data!;
  }
);

export const createSubmission = createAsyncThunk(
  'submission/createSubmission',
  async (data: CreateSubmissionData) => {
    const response = await submissionService.createSubmission(data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create submission');
    }
    return response.data!;
  }
);

export const gradeSubmission = createAsyncThunk(
  'submission/gradeSubmission',
  async ({ id, score }: { id: string; score: number }) => {
    const response = await submissionService.gradeSubmission(id, score);
    if (!response.success) {
      throw new Error(response.error || 'Failed to grade submission');
    }
    return response.data!;
  }
);

const submissionSlice = createSlice({
  name: 'submission',
  initialState,
  reducers: {
    clearCurrentSubmission: (state) => {
      state.currentSubmission = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload;
      })
      .addCase(fetchSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch submissions';
      })
      .addCase(fetchSubmissionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubmission = action.payload;
      })
      .addCase(fetchSubmissionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch submission';
      })
      .addCase(fetchSubmissionsByExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionsByExam.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload;
      })
      .addCase(fetchSubmissionsByExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch submissions';
      })
      .addCase(createSubmission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubmission.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions.push(action.payload);
        state.currentSubmission = action.payload;
      })
      .addCase(createSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create submission';
      })
      .addCase(gradeSubmission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(gradeSubmission.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.submissions.findIndex(
          (s) => s._id === action.payload._id
        );
        if (index !== -1) {
          state.submissions[index] = action.payload;
        }
        if (state.currentSubmission?._id === action.payload._id) {
          state.currentSubmission = action.payload;
        }
      })
      .addCase(gradeSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to grade submission';
      });
  },
});

export const { clearCurrentSubmission, clearError } = submissionSlice.actions;
export default submissionSlice.reducer; 