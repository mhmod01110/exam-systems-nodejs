import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Alert,
  TextField,
  CircularProgress
} from '@mui/material';
import { submitProject } from '../../redux/slices/submissionSlice';
import FileUpload from '../common/FileUpload';

const ProjectSubmission = () => {
  const { examId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('notes', notes);
      formData.append('examId', examId);

      await dispatch(submitProject(formData)).unwrap();
      navigate(`/exam/${examId}/result`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Project Submission
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          <FileUpload
            onFileSelect={setFile}
            acceptedTypes=".zip,.pdf,.doc,.docx"
            maxSize={50 * 1024 * 1024} // 50MB
          />

          <TextField
            multiline
            rows={4}
            label="Submission Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!file || uploading}
          >
            {uploading ? (
              <CircularProgress size={24} />
            ) : (
              'Submit Project'
            )}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ProjectSubmission;