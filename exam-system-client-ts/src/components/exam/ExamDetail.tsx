import { FC, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchExamById } from '../../redux/slices/examSlice';
import { fetchSubmissionsByExam } from '../../redux/slices/submissionSlice';

const ExamDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentExam: exam, loading, error } = useAppSelector((state) => state.exam);
  const { submissionList, loading: submissionsLoading } = useAppSelector(
    (state) => state.submission
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchExamById(id));
      dispatch(fetchSubmissionsByExam(id));
    }
  }, [dispatch, id]);

  if (loading || submissionsLoading) {
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
        <Typography variant="h4" component="h1" gutterBottom>
          {exam.title}
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography color="textSecondary" gutterBottom>
            Duration: {exam.duration} minutes
          </Typography>
          <Typography variant="body1" paragraph>
            {exam.description}
          </Typography>
          <Typography variant="caption" display="block">
            Created by: {exam.createdBy.name}
          </Typography>
          <Typography variant="caption" display="block">
            Created at: {new Date(exam.createdAt).toLocaleString()}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          Questions
        </Typography>

        <List>
          {exam.questions.map((question, index) => (
            <ListItem key={question._id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <ListItemText
                primary={`${index + 1}. ${question.text}`}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="textSecondary">
                      Type: {question.type}
                    </Typography>
                    <br />
                    {question.type === 'multiple_choice' && (
                      <>
                        <Typography component="span" variant="body2">
                          Options:
                        </Typography>
                        <List dense>
                          {question.options.map((option, optionIndex) => (
                            <ListItem key={optionIndex}>
                              <ListItemText primary={option} />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                    <Typography component="span" variant="body2">
                      Points: {question.points}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          Submissions ({submissionList.length})
        </Typography>

        <List>
          {submissionList.map((submission) => (
            <ListItem key={submission._id}>
              <ListItemText
                primary={`${submission.student.name}`}
                secondary={`Submitted at: ${new Date(
                  submission.submittedAt
                ).toLocaleString()}`}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(`/exam/${id}/submissions/${submission._id}`)}
              >
                View Details
              </Button>
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate('/')}>
            Back to List
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/exam/${id}/edit`)}
          >
            Edit Exam
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ExamDetail; 