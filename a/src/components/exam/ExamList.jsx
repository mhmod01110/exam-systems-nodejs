import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Assignment, Edit, Delete, PlayArrow } from '@mui/icons-material';
import { exams } from '../../services/api';

const ExamList = () => {
  const [examList, setExamList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await exams.getAll();
      setExamList(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await exams.delete(examId);
        setExamList((prevExams) => prevExams.filter((exam) => exam._id !== examId));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete exam');
      }
    }
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

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Available Exams
        </Typography>
        {user?.role === 'teacher' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Assignment />}
            onClick={() => navigate('/exam/create')}
          >
            Create New Exam
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {examList.map((exam) => (
          <Grid item xs={12} sm={6} md={4} key={exam._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {exam.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Duration: {exam.duration} minutes
                </Typography>
                <Typography variant="body2" component="p">
                  {exam.description}
                </Typography>
              </CardContent>
              <CardActions>
                {user?.role === 'teacher' ? (
                  <>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => navigate(`/exam/${exam._id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(exam._id)}
                    >
                      Delete
                    </Button>
                  </>
                ) : (
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={() => navigate(`/exam/${exam._id}/attempt`)}
                  >
                    Take Exam
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {examList.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No exams available
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ExamList;