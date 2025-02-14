import { FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchExams, deleteExam } from '../../redux/slices/examSlice';

const ExamList: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { examList, loading, error } = useAppSelector((state) => state.exam);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchExams());
  }, [dispatch]);

  const handleDelete = async (examId: string) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      await dispatch(deleteExam(examId));
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

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Available Exams
      </Typography>

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
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Created by: {exam.createdBy.name}
                </Typography>
              </CardContent>
              <CardActions>
                {user?.role === 'student' ? (
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => navigate(`/exam/${exam._id}/attempt`)}
                  >
                    Take Exam
                  </Button>
                ) : (
                  <>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/exam/${exam._id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(exam._id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ExamList; 