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
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { fetchExamById } from '@/redux/slices/examSlice';
import { createSubmission } from '@/redux/slices/submissionSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { Question } from '@/services/examService';
import { Answer } from '@/services/submissionService';
import FileUpload from '@/components/common/FileUpload';

const ExamAttempt = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentExam: exam, loading: examLoading } = useSelector(
    (state: RootState) => state.exam
  );
  const { loading: submissionLoading } = useSelector(
    (state: RootState) => state.submission
  );

  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchExamById(id));
    }
  }, [dispatch, id]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAnswerChange = (questionId: string, value: number | string) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      const index = newAnswers.findIndex((a) => a.questionId === questionId);
      const currentQuestion = exam?.questions.find((q) => q._id === questionId);

      if (!currentQuestion) return prev;

      const answer: Answer =
        currentQuestion.type === 'MCQ'
          ? { questionId, selectedOption: value as number }
          : { questionId, fileUrl: value as string };

      if (index === -1) {
        newAnswers.push(answer);
      } else {
        newAnswers[index] = answer;
      }

      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    if (!exam || !id) return;

    try {
      setError(null);
      await dispatch(
        createSubmission({
          examId: id,
          answers,
        })
      ).unwrap();
      navigate('/exams');
    } catch (err: any) {
      setError(err.message || 'Failed to submit exam');
    }
    setConfirmSubmit(false);
  };

  if (examLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!exam) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">Exam not found.</Alert>
      </Container>
    );
  }

  const currentQuestion = exam.questions[activeStep];

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {exam.title}
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep}>
            {exam.questions.map((_, index) => (
              <Step key={index}>
                <StepLabel>Question {index + 1}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ minHeight: 300 }}>
          {currentQuestion && (
            <>
              <Typography variant="h6" gutterBottom>
                Question {activeStep + 1}
              </Typography>
              <Typography variant="body1" paragraph>
                {currentQuestion.text}
              </Typography>

              {currentQuestion.type === 'MCQ' ? (
                <FormControl component="fieldset">
                  <FormLabel component="legend">Select your answer:</FormLabel>
                  <RadioGroup
                    value={
                      answers.find((a) => a.questionId === currentQuestion._id)
                        ?.selectedOption ?? ''
                    }
                    onChange={(e) =>
                      handleAnswerChange(
                        currentQuestion._id,
                        parseInt(e.target.value)
                      )
                    }
                  >
                    {currentQuestion.options?.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={index}
                        control={<Radio />}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <FileUpload
                    onFileUploaded={(fileUrl) =>
                      handleAnswerChange(currentQuestion._id, fileUrl)
                    }
                  />
                  {answers.find((a) => a.questionId === currentQuestion._id)
                    ?.fileUrl && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      File uploaded successfully
                    </Alert>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          {activeStep === exam.questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setConfirmSubmit(true)}
              disabled={submissionLoading}
            >
              Submit Exam
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>
      </Paper>

      {/* Submit Confirmation Dialog */}
      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle>Submit Exam</DialogTitle>
        <DialogContent>
          Are you sure you want to submit your exam? You won't be able to make any
          changes after submission.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submissionLoading}
          >
            {submissionLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExamAttempt; 