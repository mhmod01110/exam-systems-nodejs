import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchExamById } from '../../redux/slices/examSlice';
import { submitExam } from '../../redux/slices/submissionSlice';

interface Answer {
  question: string;
  answer: string;
}

const ExamAttempt: FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentExam: exam, loading, error } = useAppSelector((state) => state.exam);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchExamById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (exam) {
      setTimeLeft(exam.duration * 60);
      setAnswers(
        exam.questions.map((q) => ({
          question: q._id,
          answer: '',
        }))
      );
    }
  }, [exam]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.question === questionId ? { ...a, answer: value } : a
      )
    );
  };

  const handleSubmit = async () => {
    if (!id) return;
    
    setConfirmSubmit(false);
    const result = await dispatch(
      submitExam({
        examId: id,
        submissionData: { answers },
      })
    );
    if (!result.hasOwnProperty('error')) {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!exam) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Exam not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4" component="h1">
            {exam.title}
          </Typography>
          <Typography variant="h5" color={timeLeft < 300 ? 'error' : 'textPrimary'}>
            Time Left: {formatTime(timeLeft)}
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          {exam.questions.map((question, index) => (
            <Box key={question._id} sx={{ mb: 4 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  Question {index + 1}: {question.text}
                </FormLabel>
                <RadioGroup
                  value={answers.find((a) => a.question === question._id)?.answer || ''}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                >
                  {question.type === 'multiple_choice'
                    ? question.options.map((option, optionIndex) => (
                        <FormControlLabel
                          key={optionIndex}
                          value={option}
                          control={<Radio />}
                          label={option}
                        />
                      ))
                    : ['True', 'False'].map((option) => (
                        <FormControlLabel
                          key={option}
                          value={option}
                          control={<Radio />}
                          label={option}
                        />
                      ))}
                </RadioGroup>
              </FormControl>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setConfirmSubmit(true)}
          >
            Submit Exam
          </Button>
        </Box>

        <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
          <DialogTitle>Confirm Submission</DialogTitle>
          <DialogContent>
            Are you sure you want to submit your exam? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmSubmit(false)}>Cancel</Button>
            <Button onClick={handleSubmit} color="primary">
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default ExamAttempt; 