import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { fetchExams } from '@/redux/slices/examSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { Question } from '@/services/examService';

const QuestionList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { exams, loading, error } = useSelector((state: RootState) => state.exam);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<{
    examId: string;
    questionId: string;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchExams());
  }, [dispatch]);

  const handleDeleteClick = (examId: string, questionId: string) => {
    setSelectedQuestion({ examId, questionId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedQuestion) {
      // TODO: Implement question deletion
      // await dispatch(deleteQuestion(selectedQuestion)).unwrap();
    }
    setDeleteDialogOpen(false);
    setSelectedQuestion(null);
  };

  // Flatten questions from all exams and add exam information
  const questions = exams.reduce<Array<Question & { examTitle: string; examId: string }>>(
    (acc, exam) => [
      ...acc,
      ...exam.questions.map((q) => ({
        ...q,
        examTitle: exam.title,
        examId: exam._id,
      })),
    ],
    []
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
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
          Questions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/questions/create')}
        >
          Create Question
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Question Text</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Marks</TableCell>
              <TableCell>Exam</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No questions available.
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question) => (
                <TableRow key={question._id}>
                  <TableCell
                    sx={{
                      maxWidth: '300px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {question.text}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={question.type}
                      color={question.type === 'MCQ' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{question.marks}</TableCell>
                  <TableCell>{question.examTitle}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/questions/${question._id}/edit`)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(question.examId, question._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Question</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this question? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuestionList; 