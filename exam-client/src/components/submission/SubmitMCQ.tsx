import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { fetchQuestionById } from '@/redux/slices/questionSlice';
import { createSubmission } from '@/redux/slices/submissionSlice';
import { AppDispatch, RootState } from '@/redux/store';

const SubmitMCQ = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentQuestion: question, loading: questionLoading } = useSelector(
    (state: RootState) => state.question
  );
  const { loading: submissionLoading } = useSelector(
    (state: RootState) => state.submission
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (questionId) {
      dispatch(fetchQuestionById(questionId));
    }
  }, [dispatch, questionId]);

  const handleSubmit = async () => {
    if (!question || selectedOption === null) return;

    try {
      setError(null);
      await dispatch(
        createSubmission({
          examId: question.examId,
          answers: [
            {
              questionId: question._id,
              selectedOption,
            },
          ],
        })
      ).unwrap();
      navigate(`/exams/${question.examId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
    }
  };

  if (questionLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!question) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">Question not found.</Alert>
      </Container>
    );
  }

  if (question.type !== 'MCQ') {
    return (
      <Container maxWidth="md">
        <Alert severity="error">This is not an MCQ question.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Multiple Choice Question
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Question
          </Typography>
          <Typography variant="body1" paragraph>
            {question.text}
          </Typography>
        </Box>

        <FormControl component="fieldset" sx={{ width: '100%', mb: 4 }}>
          <FormLabel component="legend">Select your answer:</FormLabel>
          <RadioGroup
            value={selectedOption ?? ''}
            onChange={(e) => setSelectedOption(parseInt(e.target.value))}
          >
            {question.options?.map((option, index) => (
              <FormControlLabel
                key={index}
                value={index}
                control={<Radio />}
                label={option}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            disabled={submissionLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={selectedOption === null || submissionLoading}
          >
            {submissionLoading ? 'Submitting...' : 'Submit Answer'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SubmitMCQ; 