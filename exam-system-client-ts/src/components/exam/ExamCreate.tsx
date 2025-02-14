import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { createExam } from '../../redux/slices/examSlice';
import { Question } from '../../types';

interface ExamFormValues {
  title: string;
  description: string;
  duration: number;
  questions: {
    text: string;
    type: 'multiple_choice' | 'true_false';
    options: string[];
    correctAnswer: string;
    points: number;
  }[];
}

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  duration: Yup.number()
    .required('Duration is required')
    .min(1, 'Duration must be at least 1 minute'),
  questions: Yup.array()
    .of(
      Yup.object({
        text: Yup.string().required('Question text is required'),
        type: Yup.string()
          .oneOf(['multiple_choice', 'true_false'])
          .required('Question type is required'),
        options: Yup.array().when('type', {
          is: 'multiple_choice',
          then: Yup.array()
            .min(2, 'At least 2 options are required')
            .of(Yup.string().required('Option is required')),
          otherwise: Yup.array().min(0),
        }),
        correctAnswer: Yup.string().required('Correct answer is required'),
        points: Yup.number()
          .required('Points are required')
          .min(1, 'Points must be at least 1'),
      })
    )
    .min(1, 'At least one question is required'),
});

const ExamCreate: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.exam);
  const [currentOption, setCurrentOption] = useState('');

  const formik = useFormik<ExamFormValues>({
    initialValues: {
      title: '',
      description: '',
      duration: 60,
      questions: [
        {
          text: '',
          type: 'multiple_choice',
          options: [],
          correctAnswer: '',
          points: 1,
        },
      ],
    },
    validationSchema,
    onSubmit: async (values) => {
      const result = await dispatch(createExam(values));
      if (!result.hasOwnProperty('error')) {
        navigate('/');
      }
    },
  });

  const handleAddQuestion = () => {
    formik.setFieldValue('questions', [
      ...formik.values.questions,
      {
        text: '',
        type: 'multiple_choice',
        options: [],
        correctAnswer: '',
        points: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...formik.values.questions];
    newQuestions.splice(index, 1);
    formik.setFieldValue('questions', newQuestions);
  };

  const handleAddOption = (questionIndex: number) => {
    if (currentOption.trim()) {
      const newOptions = [
        ...formik.values.questions[questionIndex].options,
        currentOption.trim(),
      ];
      formik.setFieldValue(`questions.${questionIndex}.options`, newOptions);
      setCurrentOption('');
    }
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const newOptions = [...formik.values.questions[questionIndex].options];
    newOptions.splice(optionIndex, 1);
    formik.setFieldValue(`questions.${questionIndex}.options`, newOptions);
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Exam
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            id="title"
            name="title"
            label="Exam Title"
            value={formik.values.title}
            onChange={formik.handleChange}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title}
            margin="normal"
          />

          <TextField
            fullWidth
            id="description"
            name="description"
            label="Description"
            multiline
            rows={3}
            value={formik.values.description}
            onChange={formik.handleChange}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
            margin="normal"
          />

          <TextField
            fullWidth
            id="duration"
            name="duration"
            label="Duration (minutes)"
            type="number"
            value={formik.values.duration}
            onChange={formik.handleChange}
            error={formik.touched.duration && Boolean(formik.errors.duration)}
            helperText={formik.touched.duration && formik.errors.duration}
            margin="normal"
          />

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Questions
          </Typography>

          {formik.values.questions.map((question, questionIndex) => (
            <Box key={questionIndex} sx={{ mb: 4, p: 2, border: '1px solid #ddd' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1">
                  Question {questionIndex + 1}
                </Typography>
                {formik.values.questions.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveQuestion(questionIndex)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <TextField
                fullWidth
                name={`questions.${questionIndex}.text`}
                label="Question Text"
                value={question.text}
                onChange={formik.handleChange}
                error={
                  formik.touched.questions?.[questionIndex]?.text &&
                  Boolean(formik.errors.questions?.[questionIndex]?.text)
                }
                helperText={
                  formik.touched.questions?.[questionIndex]?.text &&
                  formik.errors.questions?.[questionIndex]?.text
                }
                margin="normal"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Question Type</InputLabel>
                <Select
                  name={`questions.${questionIndex}.type`}
                  value={question.type}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                  <MenuItem value="true_false">True/False</MenuItem>
                </Select>
              </FormControl>

              {question.type === 'multiple_choice' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Options</Typography>
                  {question.options.map((option, optionIndex) => (
                    <Box
                      key={optionIndex}
                      sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                    >
                      <Typography>{option}</Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveOption(questionIndex, optionIndex)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField
                      size="small"
                      value={currentOption}
                      onChange={(e) => setCurrentOption(e.target.value)}
                      placeholder="Add option"
                    />
                    <Button
                      variant="outlined"
                      onClick={() => handleAddOption(questionIndex)}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>
              )}

              <TextField
                fullWidth
                name={`questions.${questionIndex}.correctAnswer`}
                label="Correct Answer"
                value={question.correctAnswer}
                onChange={formik.handleChange}
                error={
                  formik.touched.questions?.[questionIndex]?.correctAnswer &&
                  Boolean(formik.errors.questions?.[questionIndex]?.correctAnswer)
                }
                helperText={
                  formik.touched.questions?.[questionIndex]?.correctAnswer &&
                  formik.errors.questions?.[questionIndex]?.correctAnswer
                }
                margin="normal"
              />

              <TextField
                fullWidth
                name={`questions.${questionIndex}.points`}
                label="Points"
                type="number"
                value={question.points}
                onChange={formik.handleChange}
                error={
                  formik.touched.questions?.[questionIndex]?.points &&
                  Boolean(formik.errors.questions?.[questionIndex]?.points)
                }
                helperText={
                  formik.touched.questions?.[questionIndex]?.points &&
                  formik.errors.questions?.[questionIndex]?.points
                }
                margin="normal"
              />
            </Box>
          ))}

          <Button
            variant="outlined"
            onClick={handleAddQuestion}
            sx={{ mt: 2, mb: 4 }}
          >
            Add Question
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ flex: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Exam'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/')}
              sx={{ flex: 1 }}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ExamCreate; 