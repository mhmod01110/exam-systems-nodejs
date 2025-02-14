import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { examService, Question } from '@/services/examService';

interface CreateQuestionData {
  text: string;
  type: 'MCQ' | 'PROJECT';
  marks: number;
  options?: string[];
  correctOption?: number;
  examId: string;
}

interface UpdateQuestionData extends Partial<CreateQuestionData> {
  questionId: string;
}

interface QuestionState {
  questions: Question[];
  currentQuestion: Question | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuestionState = {
  questions: [],
  currentQuestion: null,
  loading: false,
  error: null,
};

export const createQuestion = createAsyncThunk(
  'question/create',
  async (data: CreateQuestionData) => {
    const response = await examService.addQuestionToExam(data.examId, {
      text: data.text,
      type: data.type,
      marks: data.marks,
      options: data.options,
      correctOption: data.correctOption,
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to create question');
    }
    return response.data!;
  }
);

export const updateQuestion = createAsyncThunk(
  'question/update',
  async (data: UpdateQuestionData) => {
    const { questionId, ...questionData } = data;
    const response = await examService.updateQuestion(questionId, questionData);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update question');
    }
    return response.data!;
  }
);

export const deleteQuestion = createAsyncThunk(
  'question/delete',
  async ({ examId, questionId }: { examId: string; questionId: string }) => {
    const response = await examService.removeQuestionFromExam(examId, questionId);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete question');
    }
    return { examId, questionId };
  }
);

export const fetchQuestionById = createAsyncThunk(
  'question/fetchById',
  async (questionId: string) => {
    const response = await examService.getQuestionById(questionId);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch question');
    }
    return response.data!;
  }
);

const questionSlice = createSlice({
  name: 'question',
  initialState,
  reducers: {
    clearCurrentQuestion: (state) => {
      state.currentQuestion = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Question
      .addCase(createQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions.push(action.payload);
        state.currentQuestion = action.payload;
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create question';
      })

      // Update Question
      .addCase(updateQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.questions.findIndex(
          (q) => q._id === action.payload._id
        );
        if (index !== -1) {
          state.questions[index] = action.payload;
        }
        state.currentQuestion = action.payload;
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update question';
      })

      // Delete Question
      .addCase(deleteQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = state.questions.filter(
          (q) => q._id !== action.payload.questionId
        );
        if (state.currentQuestion?._id === action.payload.questionId) {
          state.currentQuestion = null;
        }
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete question';
      })

      // Fetch Question
      .addCase(fetchQuestionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuestion = action.payload;
      })
      .addCase(fetchQuestionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch question';
      });
  },
});

export const { clearCurrentQuestion, clearError } = questionSlice.actions;
export default questionSlice.reducer; 