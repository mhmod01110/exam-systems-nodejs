import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  Paper,
  Stack,
  Alert,
  LinearProgress
} from '@mui/material';
import { submitMCQExam } from '../../redux/slices/submissionSlice';
import { fetchExamQuestions } from '../../redux/slices/examSlice';

const MCQSubmission = () => {
  const { examId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  
  const { questions, exam, loading } = useSelector((state) => state.exam);

  useEffect(() => {
    dispatch(fetchExamQuestions(examId));
  }, [examId, dispatch]);

  useEffect(() => {
    if (exam?.duration) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [exam]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      await dispatch(submitMCQExam({ examId, answers })).unwrap();
      navigate(`/exam/${examId}/result`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {exam?.title}
        </Typography>
        
        {timeLeft && (
          <Typography color="error" variant="h6">
            Time Remaining: {Math.floor(timeLeft / 60)}:{timeLeft % 60}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      <Stack spacing={4}>
        {questions.map((question, index) => (
          <Paper key={question._id} sx={{ p: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">
                <Typography variant="h6">
                  {index + 1}. {question.questionText}
                </Typography>
              </FormLabel>
              <RadioGroup
                value={answers[question._id] || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              >
                {question.options.map((option, optIndex) => (
                  <FormControlLabel
                    key={optIndex}
                    value={optIndex.toString()}
                    control={<Radio />}
                    label={option.text}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Paper>
        ))}
      </Stack>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSubmit}
          disabled={Object.keys(answers).length !== questions.length}
        >
          Submit Exam
        </Button>
      </Box>
    </Box>
  );
};

export default MCQSubmission;