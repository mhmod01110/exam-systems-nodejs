import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { fetchExams } from '@/redux/slices/examSlice';
import { AppDispatch, RootState } from '@/redux/store';

const ExamList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { exams, loading, error } = useSelector((state: RootState) => state.exam);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchExams());
  }, [dispatch]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Exams
        </Typography>
        {(user?.role === 'teacher' || user?.role === 'supervisor') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/exams/create')}
          >
            Create Exam
          </Button>
        )}
      </Box>

      {exams.length === 0 ? (
        <Typography variant="body1" color="textSecondary" align="center">
          No exams available.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {exams.map((exam) => (
            <Grid item xs={12} sm={6} md={4} key={exam._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {exam.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mb: 2,
                    }}
                  >
                    {exam.description}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Duration: {exam.duration} minutes
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Marks: {exam.totalMarks}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Questions: {exam.questions.length}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/exams/${exam._id}`)}
                  >
                    View Details
                  </Button>
                  {user?.role === 'student' && (
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/exams/${exam._id}/attempt`)}
                    >
                      Take Exam
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ExamList; 