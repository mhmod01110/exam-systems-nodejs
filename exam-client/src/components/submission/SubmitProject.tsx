import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { fetchQuestionById } from '@/redux/slices/questionSlice';
import { createSubmission } from '@/redux/slices/submissionSlice';
import { AppDispatch, RootState } from '@/redux/store';
import FileUpload from '@/components/common/FileUpload';

const SubmitProject = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentQuestion: question, loading: questionLoading } = useSelector(
    (state: RootState) => state.question
  );
  const { loading: submissionLoading } = useSelector(
    (state: RootState) => state.submission
  );
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (questionId) {
      dispatch(fetchQuestionById(questionId));
    }
  }, [dispatch, questionId]);

  const handleSubmit = async () => {
    if (!question || !uploadedFileUrl) return;

    try {
      setError(null);
      await dispatch(
        createSubmission({
          examId: question.examId,
          answers: [
            {
              questionId: question._id,
              fileUrl: uploadedFileUrl,
            },
          ],
        })
      ).unwrap();
      navigate(`/exams/${question.examId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit project');
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

  if (question.type !== 'PROJECT') {
    return (
      <Container maxWidth="md">
        <Alert severity="error">This is not a project submission question.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Project Submission
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

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Upload Project Files
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Please upload your project files in a compressed format (ZIP, RAR).
            Maximum file size is 50MB.
          </Typography>

          <FileUpload
            onFileUploaded={(fileUrl) => setUploadedFileUrl(fileUrl)}
            accept=".zip,.rar"
            maxSize={50 * 1024 * 1024} // 50MB
          />

          {uploadedFileUrl && (
            <Alert severity="success" sx={{ mt: 2 }}>
              File uploaded successfully
            </Alert>
          )}
        </Box>

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
            disabled={!uploadedFileUrl || submissionLoading}
          >
            {submissionLoading ? 'Submitting...' : 'Submit Project'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SubmitProject; 