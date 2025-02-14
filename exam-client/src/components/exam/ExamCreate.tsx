import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { examSchema } from '@/utils/validators';
import { createExam } from '@/redux/slices/examSlice';
import { AppDispatch, RootState } from '@/redux/store';

const ExamCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.exam);
  const [showError, setShowError] = useState(false);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      type: 'MCQ',
      duration: 60,
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      totalMarks: 100,
      passingMarks: 50,
      department: '',
      isPublic: false,
      shuffleQuestions: true,
      showResults: true,
      resultReleaseDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
      instructions: '',
      maxAttempts: 1,
    },
    validationSchema: examSchema,
    onSubmit: async (values) => {
      try {
        const result = await dispatch(createExam(values)).unwrap();
        if (result) {
          navigate(`/exams/${result._id}`);
        }
      } catch (err) {
        setShowError(true);
      }
    },
  });

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Exam
        </Typography>

        {showError && error && (
          <Alert
            severity="error"
            onClose={() => setShowError(false)}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={formik.handleSubmit}>
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
                  onChange={formik.handleChange}
                  label="Exam Type"
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
                id="department"
                name="department"
                label="Department"
                value={formik.values.department}
                onChange={formik.handleChange}
                error={formik.touched.department && Boolean(formik.errors.department)}
                helperText={formik.touched.department && formik.errors.department}
              />
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
                InputProps={{ inputProps: { min: 5, max: 480 } }}
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
                InputProps={{ inputProps: { min: 1 } }}
              />
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
                InputProps={{ inputProps: { min: 1 } }}
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
                InputProps={{ 
                  inputProps: { 
                    min: 1, 
                    max: formik.values.totalMarks 
                  } 
                }}
              />
            </Grid>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Start Date"
                  value={formik.values.startDate}
                  onChange={(value) => formik.setFieldValue('startDate', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.startDate && Boolean(formik.errors.startDate),
                      helperText: formik.touched.startDate && formik.errors.startDate,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="End Date"
                  value={formik.values.endDate}
                  onChange={(value) => formik.setFieldValue('endDate', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.endDate && Boolean(formik.errors.endDate),
                      helperText: formik.touched.endDate && formik.errors.endDate,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Result Release Date"
                  value={formik.values.resultReleaseDate}
                  onChange={(value) => formik.setFieldValue('resultReleaseDate', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.resultReleaseDate && Boolean(formik.errors.resultReleaseDate),
                      helperText: formik.touched.resultReleaseDate && formik.errors.resultReleaseDate,
                    },
                  }}
                />
              </Grid>
            </LocalizationProvider>

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
        </Box>
      </Paper>
    </Container>
  );
};

export default ExamCreate; 