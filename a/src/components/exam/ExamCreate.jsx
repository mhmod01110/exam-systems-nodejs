import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { exams } from '../../services/api';

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  duration: Yup.number()
    .required('Duration is required')
    .min(1, 'Duration must be at least 1 minute'),
  questions: Yup.array().of(
    Yup.object({
      text: Yup.string().required('Question text is required'),
      type: Yup.string()
        .oneOf(['multiple_choice', 'true_false'], 'Invalid question type')
        .required('Question type is required'),
      options: Yup.array().when('type', {
        is: 'multiple_choice',
        then: Yup.array()
          .of(Yup.string().required('Option text is required'))
          .min(2, 'At least 2 options are required')
          .required('Options are required'),
      }),
      correctAnswer: Yup.string().required('Correct answer is required'),
      points: Yup.number()
        .required('Points are required')
        .min(1, 'Points must be at least 1'),
    })
  ),
});

const ExamCreate = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      duration: '',
      questions: [
        {
          text: '',
          type: 'multiple_choice',
          options: ['', ''],
          correctAnswer: '',
          points: 1,
        },
      ],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await exams.create(values);
        navigate('/');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to create exam');
      }
    },
  });

  const addQuestion = () => {
    const questions = [...formik.values.questions];
    questions.push({
      text: '',
      type: 'multiple_choice',
      options: ['', ''],
      correctAnswer: '',
      points: 1,
    });
    formik.setFieldValue('questions', questions);
  };

  const removeQuestion = (index) => {
    const questions = [...formik.values.questions];
    questions.splice(index, 1);
    formik.setFieldValue('questions', questions);
  };

  const addOption = (questionIndex) => {
    const questions = [...formik.values.questions];
    questions[questionIndex].options.push('');
    formik.setFieldValue('questions', questions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const questions = [...formik.values.questions];
    questions[questionIndex].options.splice(optionIndex, 1);
    formik.setFieldValue('questions', questions);
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
        Create New Exam
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
          <TextField
            fullWidth
            name="title"
            label="Exam Title"
            value={formik.values.title}
            onChange={formik.handleChange}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title}
          />
            </Grid>
            <Grid item xs={12}>
          <TextField
            fullWidth
            name="description"
            label="Description"
                multiline
                rows={3}
            value={formik.values.description}
            onChange={formik.handleChange}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
          />
            </Grid>
            <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="duration"
            label="Duration (minutes)"
                type="number"
            value={formik.values.duration}
            onChange={formik.handleChange}
            error={formik.touched.duration && Boolean(formik.errors.duration)}
            helperText={formik.touched.duration && formik.errors.duration}
          />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Questions
            </Typography>
          </Box>

          {formik.values.questions.map((question, questionIndex) => (
            <Card key={questionIndex} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Question {questionIndex + 1}</Typography>
                  {formik.values.questions.length > 1 && (
                    <IconButton
                      color="error"
                      onClick={() => removeQuestion(questionIndex)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
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
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Question Type</InputLabel>
                      <Select
                        name={`questions.${questionIndex}.type`}
                        value={question.type}
                        label="Question Type"
                        onChange={formik.handleChange}
                      >
                        <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                        <MenuItem value="true_false">True/False</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
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
                    />
                  </Grid>

                  {question.type === 'multiple_choice' && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Options
                      </Typography>
                      {question.options.map((option, optionIndex) => (
                        <Box
                          key={optionIndex}
                          sx={{ display: 'flex', gap: 1, mb: 1 }}
                        >
          <TextField
            fullWidth
                            name={`questions.${questionIndex}.options.${optionIndex}`}
                            label={`Option ${optionIndex + 1}`}
                            value={option}
            onChange={formik.handleChange}
                          />
                          {question.options.length > 2 && (
                            <IconButton
                              color="error"
                              onClick={() => removeOption(questionIndex, optionIndex)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => addOption(questionIndex)}
                        sx={{ mt: 1 }}
                      >
                        Add Option
                      </Button>
                    </Grid>
                  )}

                  <Grid item xs={12}>
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
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addQuestion}
            sx={{ mb: 3 }}
          >
            Add Question
          </Button>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/')}>
              Cancel
            </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
              disabled={formik.isSubmitting}
          >
            Create Exam
          </Button>
          </Box>
      </form>
      </Paper>
    </Container>
  );
};

export default ExamCreate;