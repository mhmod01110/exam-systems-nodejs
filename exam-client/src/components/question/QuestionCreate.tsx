import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Paper,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  InputLabel,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { questionSchema } from '@/utils/validators';
import { fetchExams } from '@/redux/slices/examSlice';
import { createQuestion } from '@/redux/slices/questionSlice';
import { AppDispatch, RootState } from '@/redux/store';

interface QuestionFormValues {
  text: string;
  type: 'MCQ' | 'PROJECT';
  marks: number;
  options: string[];
  correctOption: number;
  examId: string;
}

const QuestionCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const examIdFromUrl = searchParams.get('examId');
  const { exams, loading: examsLoading } = useSelector(
    (state: RootState) => state.exam
  );
  const { loading: questionLoading } = useSelector(
    (state: RootState) => state.question
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchExams());
  }, [dispatch]);

  const formik = useFormik<QuestionFormValues>({
    initialValues: {
      text: '',
      type: 'MCQ',
      marks: 1,
      options: ['', ''],
      correctOption: 0,
      examId: examIdFromUrl || '',
    },
    validationSchema: questionSchema,
    onSubmit: async (values) => {
      try {
        await dispatch(createQuestion(values)).unwrap();
        navigate(`/exams/${values.examId}`);
      } catch (err: any) {
        setError(err.message || 'Failed to create question');
      }
    },
  });

  const handleAddOption = () => {
    formik.setFieldValue('options', [...formik.values.options, '']);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = formik.values.options.filter((_, i) => i !== index);
    formik.setFieldValue('options', newOptions);
    if (formik.values.correctOption >= index) {
      formik.setFieldValue('correctOption', Math.max(0, formik.values.correctOption - 1));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formik.values.options];
    newOptions[index] = value;
    formik.setFieldValue('options', newOptions);
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Question
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="exam-select-label">Select Exam</InputLabel>
                <Select
                  labelId="exam-select-label"
                  id="examId"
                  name="examId"
                  value={formik.values.examId}
                  onChange={formik.handleChange}
                  error={formik.touched.examId && Boolean(formik.errors.examId)}
                  label="Select Exam"
                  disabled={!!examIdFromUrl}
                >
                  {exams.map((exam) => (
                    <MenuItem key={exam._id} value={exam._id}>
                      {exam.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="text"
                name="text"
                label="Question Text"
                multiline
                rows={3}
                value={formik.values.text}
                onChange={formik.handleChange}
                error={formik.touched.text && Boolean(formik.errors.text)}
                helperText={formik.touched.text && formik.errors.text}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Question Type</FormLabel>
                <RadioGroup
                  row
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                >
                  <FormControlLabel
                    value="MCQ"
                    control={<Radio />}
                    label="Multiple Choice"
                  />
                  <FormControlLabel
                    value="PROJECT"
                    control={<Radio />}
                    label="Project Upload"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="marks"
                name="marks"
                label="Marks"
                type="number"
                value={formik.values.marks}
                onChange={formik.handleChange}
                error={formik.touched.marks && Boolean(formik.errors.marks)}
                helperText={formik.touched.marks && formik.errors.marks}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>

            {formik.values.type === 'MCQ' && (
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Options
                  </Typography>
                  <List>
                    {formik.values.options.map((option, index) => (
                      <ListItem
                        key={index}
                        sx={{ px: 0 }}
                        secondaryAction={
                          formik.values.options.length > 2 && (
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveOption(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )
                        }
                      >
                        <ListItemText>
                          <TextField
                            fullWidth
                            value={option}
                            onChange={(e) =>
                              handleOptionChange(index, e.target.value)
                            }
                            label={`Option ${index + 1}`}
                            error={
                              formik.touched.options &&
                              formik.errors.options &&
                              Array.isArray(formik.errors.options) &&
                              Boolean(formik.errors.options[index])
                            }
                            helperText={
                              formik.touched.options &&
                              formik.errors.options &&
                              Array.isArray(formik.errors.options) &&
                              formik.errors.options[index]
                            }
                          />
                        </ListItemText>
                      </ListItem>
                    ))}
                  </List>
                  <Button variant="outlined" onClick={handleAddOption}>
                    Add Option
                  </Button>
                </Box>

                <FormControl fullWidth>
                  <InputLabel id="correct-option-label">
                    Correct Option
                  </InputLabel>
                  <Select
                    labelId="correct-option-label"
                    id="correctOption"
                    name="correctOption"
                    value={formik.values.correctOption}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.correctOption &&
                      Boolean(formik.errors.correctOption)
                    }
                    label="Correct Option"
                  >
                    {formik.values.options.map((_, index) => (
                      <MenuItem key={index} value={index}>
                        Option {index + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={examsLoading || questionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={examsLoading || questionLoading}
                >
                  {questionLoading ? 'Creating...' : 'Create Question'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default QuestionCreate; 