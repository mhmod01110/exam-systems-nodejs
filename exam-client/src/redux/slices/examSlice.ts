import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { examService, Exam, CreateExamData, UpdateExamData } from '@/services/examService';

interface ExamState {
  exams: Exam[];
  currentExam: Exam | null;
  loading: boolean;
  error: string | null;
}

const initialState: ExamState = {
  exams: [],
  currentExam: null,
  loading: false,
  error: null,
};

export const fetchExams = createAsyncThunk('exam/fetchExams', async () => {
  const response = await examService.getExams();
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch exams');
  }
  return response.data!;
});

export const fetchExamById = createAsyncThunk(
  'exam/fetchExamById',
  async (id: string) => {
    const response = await examService.getExamById(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch exam');
    }
    return response.data!;
  }
);

export const createExam = createAsyncThunk(
  'exam/createExam',
  async (data: CreateExamData) => {
    const response = await examService.createExam(data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create exam');
    }
    return response.data!;
  }
);

export const updateExam = createAsyncThunk(
  'exam/updateExam',
  async ({ id, data }: { id: string; data: UpdateExamData }) => {
    const response = await examService.updateExam(id, data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update exam');
    }
    return response.data!;
  }
);

export const deleteExam = createAsyncThunk(
  'exam/deleteExam',
  async (id: string) => {
    const response = await examService.deleteExam(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete exam');
    }
    return id;
  }
);

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    clearCurrentExam: (state) => {
      state.currentExam = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch exams';
      })
      .addCase(fetchExamById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExam = action.payload;
      })
      .addCase(fetchExamById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch exam';
      })
      .addCase(createExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExam.fulfilled, (state, action) => {
        state.loading = false;
        state.exams.push(action.payload);
      })
      .addCase(createExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create exam';
      })
      .addCase(updateExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExam.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.exams.findIndex((e) => e._id === action.payload._id);
        if (index !== -1) {
          state.exams[index] = action.payload;
        }
        if (state.currentExam?._id === action.payload._id) {
          state.currentExam = action.payload;
        }
      })
      .addCase(updateExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update exam';
      })
      .addCase(deleteExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExam.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = state.exams.filter((e) => e._id !== action.payload);
        if (state.currentExam?._id === action.payload) {
          state.currentExam = null;
        }
      })
      .addCase(deleteExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete exam';
      });
  },
});

export const { clearCurrentExam, clearError } = examSlice.actions;
export default examSlice.reducer; 