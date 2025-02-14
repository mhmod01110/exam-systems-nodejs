import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import { exams, submissions } from '../../services/api';

const ExamAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [id]);

  useEffect(() => {
    if (exam) {
      setTimeLeft(exam.duration * 60); // Convert minutes to seconds
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [exam]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const response = await exams.getById(id);
      setExam(response.data);
      // Initialize answers object
      const initialAnswers = {};
      response.data.questions.forEach((question) => {
        initialAnswers[question._id] = '';
      });
      setAnswers(initialAnswers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exam');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const submissionData = {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          question: questionId,
          answer,
        })),
      };
      await submissions.submit(id, submissionData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4" component="h1">
            {exam.title}
          </Typography>
          <Box>
            <Typography variant="h6" color="primary">
              Time Left: {formatTime(timeLeft)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(timeLeft / (exam.duration * 60)) * 100}
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>

        <Typography variant="body1" paragraph>
          {exam.description}
        </Typography>

        {exam.questions.map((question, index) => (
          <Box key={question._id} sx={{ mb: 4 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">
                <Typography variant="h6">
                  Question {index + 1} ({question.points} points)
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                  {question.text}
                </Typography>
              </FormLabel>
              <RadioGroup
                value={answers[question._id]}
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setConfirmSubmit(true)}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Submit Exam'}
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
      >
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your exam? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" autoFocus>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExamAttempt;
