import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { createExam } from '../redux/slices/examSlice';
import { examSchema } from '../utils/validators';
import { RootState } from '../redux/store';
import { CreateExamData } from '../types/exam';

const ExamCreate: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.exam);

  const formik = useFormik<CreateExamData>({
    initialValues: {
      title: '',
      description: '',
      type: 'MCQ',
      duration: 60,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
      totalMarks: 100,
      passingMarks: 50,
      department: '',
      isPublic: true,
      shuffleQuestions: false,
      showResults: true,
      resultReleaseDate: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
      instructions: '',
      maxAttempts: 1,
    },
    validationSchema: examSchema,
    onSubmit: async (values) => {
      try {
        await dispatch(createExam(values)).unwrap();
        navigate('/exams');
      } catch (err) {
        // Error will be handled by the reducer
      }
    },
  });

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create New Exam
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="title"
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
                id="description"
                name="description"
                label="Description"
                multiline
                rows={4}
                value={formik.values.description}
                onChange={formik.handleChange}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="type-label">Exam Type</InputLabel>
                <Select
                  labelId="type-label"
                  id="type"
                  name="type"
                  value={formik.values.type}
                  label="Exam Type"
                  onChange={formik.handleChange}
                  error={formik.touched.type && Boolean(formik.errors.type)}
                >
                  <MenuItem value="MCQ">Multiple Choice</MenuItem>
                  <MenuItem value="PROJECT">Project</MenuItem>
                  <MenuItem value="MIXED">Mixed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
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
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Date"
                  value={formik.values.startDate}
                  onChange={(value) => formik.setFieldValue('startDate', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.startDate && Boolean(formik.errors.startDate),
                      helperText: formik.touched.startDate && formik.errors.startDate as string,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Date"
                  value={formik.values.endDate}
                  onChange={(value) => formik.setFieldValue('endDate', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.endDate && Boolean(formik.errors.endDate),
                      helperText: formik.touched.endDate && formik.errors.endDate as string,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="totalMarks"
                name="totalMarks"
                label="Total Marks"
                type="number"
                value={formik.values.totalMarks}
                onChange={formik.handleChange}
                error={formik.touched.totalMarks && Boolean(formik.errors.totalMarks)}
                helperText={formik.touched.totalMarks && formik.errors.totalMarks}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="passingMarks"
                name="passingMarks"
                label="Passing Marks"
                type="number"
                value={formik.values.passingMarks}
                onChange={formik.handleChange}
                error={formik.touched.passingMarks && Boolean(formik.errors.passingMarks)}
                helperText={formik.touched.passingMarks && formik.errors.passingMarks}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="department"
                name="department"
                label="Department"
                value={formik.values.department}
                onChange={formik.handleChange}
                error={formik.touched.department && Boolean(formik.errors.department)}
                helperText={formik.touched.department && formik.errors.department}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="instructions"
                name="instructions"
                label="Instructions"
                multiline
                rows={4}
                value={formik.values.instructions}
                onChange={formik.handleChange}
                error={formik.touched.instructions && Boolean(formik.errors.instructions)}
                helperText={formik.touched.instructions && formik.errors.instructions}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="maxAttempts"
                name="maxAttempts"
                label="Maximum Attempts"
                type="number"
                value={formik.values.maxAttempts}
                onChange={formik.handleChange}
                error={formik.touched.maxAttempts && Boolean(formik.errors.maxAttempts)}
                helperText={formik.touched.maxAttempts && formik.errors.maxAttempts}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Result Release Date"
                  value={formik.values.resultReleaseDate}
                  onChange={(value) => formik.setFieldValue('resultReleaseDate', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.resultReleaseDate && Boolean(formik.errors.resultReleaseDate),
                      helperText: formik.touched.resultReleaseDate && formik.errors.resultReleaseDate as string,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.isPublic}
                    onChange={(e) => formik.setFieldValue('isPublic', e.target.checked)}
                    name="isPublic"
                  />
                }
                label="Make Exam Public"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.shuffleQuestions}
                    onChange={(e) => formik.setFieldValue('shuffleQuestions', e.target.checked)}
                    name="shuffleQuestions"
                  />
                }
                label="Shuffle Questions"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.showResults}
                    onChange={(e) => formik.setFieldValue('showResults', e.target.checked)}
                    name="showResults"
                  />
                }
                label="Show Results to Students"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/exams')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Exam'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ExamCreate; 