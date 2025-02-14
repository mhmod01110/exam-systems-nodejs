import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { fetchExamById, deleteExam } from '@/redux/slices/examSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { Question } from '@/services/examService';
import { User } from '@/services/authService';

const ExamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentExam: exam, loading, error } = useSelector(
    (state: RootState) => state.exam
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchExamById(id));
    }
  }, [dispatch, id]);

  const handleDelete = async () => {
    try {
      if (id) {
        await dispatch(deleteExam(id)).unwrap();
        navigate('/exams');
      }
    } catch (err) {
      // Error will be handled by the reducer
    }
    setDeleteDialogOpen(false);
  };

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'supervisor';
  const isExamCreator = exam?.createdBy === (user as User)?.id;
  const canManageExam = isTeacherOrAdmin && isExamCreator;

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

  if (!exam) {
    return (
      <Container maxWidth="md">
        <Alert severity="info" sx={{ mt: 2 }}>
          Exam not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {exam.title}
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              {exam.description}
            </Typography>
          </Box>
          {canManageExam && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/exams/${exam._id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Exam Details
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="body2">
                  <strong>Type:</strong> {exam.type}
                </Typography>
                <Typography variant="body2">
                  <strong>Duration:</strong> {exam.duration} minutes
                </Typography>
                <Typography variant="body2">
                  <strong>Total Marks:</strong> {exam.totalMarks}
                </Typography>
                <Typography variant="body2">
                  <strong>Passing Marks:</strong> {exam.passingMarks}
                </Typography>
                <Typography variant="body2">
                  <strong>Department:</strong> {exam.department}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong>{' '}
                  <Chip
                    label={exam.status}
                    color={
                      exam.status === 'PUBLISHED'
                        ? 'success'
                        : exam.status === 'DRAFT'
                        ? 'default'
                        : 'primary'
                    }
                    size="small"
                  />
                </Typography>
                <Typography variant="body2">
                  <strong>Start Date:</strong>{' '}
                  {new Date(exam.startDate).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>End Date:</strong>{' '}
                  {new Date(exam.endDate).toLocaleString()}
                </Typography>
                {exam.resultReleaseDate && (
                  <Typography variant="body2">
                    <strong>Result Release Date:</strong>{' '}
                    {new Date(exam.resultReleaseDate).toLocaleString()}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Questions
                </Typography>
                {canManageExam && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/questions/create?examId=${exam._id}`)}
                  >
                    Add Question
                  </Button>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              {exam.questions.length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center">
                  No questions added yet.
                </Typography>
              ) : (
                <List>
                  {exam.questions.map((question: Question, index: number) => (
                    <ListItem
                      key={question._id}
                      divider={index !== exam.questions.length - 1}
                    >
                      <ListItemText
                        primary={question.questionText}
                        secondary={
                          <>
                            Type: {question.type} | Marks: {question.marks}
                            {question.type === 'MCQ' && ` | Options: ${question.options?.length || 0}`}
                          </>
                        }
                      />
                      {canManageExam && (
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => navigate(`/questions/${question._id}/edit`)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            color="error"
                            sx={{ ml: 1 }}
                            onClick={() => {
                              // TODO: Implement question deletion
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Exam</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this exam? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExamDetail; 