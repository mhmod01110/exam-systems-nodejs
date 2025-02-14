import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { exams } from '../../services/api';
import { ExamState, Exam } from '../../types';

// Async thunks
export const fetchExams = createAsyncThunk(
  'exam/fetchExams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await exams.getAll();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exams');
    }
  }
);

export const fetchExamById = createAsyncThunk(
  'exam/fetchExamById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await exams.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exam');
    }
  }
);

export const createExam = createAsyncThunk(
  'exam/createExam',
  async (examData: Partial<Exam>, { rejectWithValue }) => {
    try {
      const response = await exams.create(examData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create exam');
    }
  }
);

export const updateExam = createAsyncThunk(
  'exam/updateExam',
  async ({ id, examData }: { id: string; examData: Partial<Exam> }, { rejectWithValue }) => {
    try {
      const response = await exams.update(id, examData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update exam');
    }
  }
);

export const deleteExam = createAsyncThunk(
  'exam/deleteExam',
  async (id: string, { rejectWithValue }) => {
    try {
      await exams.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete exam');
    }
  }
);

const initialState: ExamState = {
  examList: [],
  currentExam: null,
  loading: false,
  error: null,
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentExam: (state) => {
      state.currentExam = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch exams cases
      .addCase(fetchExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.loading = false;
        state.examList = action.payload;
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch exam by id cases
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
        state.error = action.payload as string;
      })
      // Create exam cases
      .addCase(createExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExam.fulfilled, (state, action) => {
        state.loading = false;
        state.examList.push(action.payload);
      })
      .addCase(createExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update exam cases
      .addCase(updateExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExam.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExam = action.payload;
        const index = state.examList.findIndex((exam) => exam._id === action.payload._id);
        if (index !== -1) {
          state.examList[index] = action.payload;
        }
      })
      .addCase(updateExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete exam cases
      .addCase(deleteExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExam.fulfilled, (state, action) => {
        state.loading = false;
        state.examList = state.examList.filter((exam) => exam._id !== action.payload);
        if (state.currentExam?._id === action.payload) {
          state.currentExam = null;
        }
      })
      .addCase(deleteExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentExam } = examSlice.actions;
export default examSlice.reducer; 