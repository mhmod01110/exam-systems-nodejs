const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const questionController = require('../controllers/questionController');
const { isAuth, isTeacher, isAdmin } = require('../middleware/auth');

// Exam routes
router.get('/', isAuth, examController.getExams);
router.get('/create', isAuth, isTeacher, examController.getCreateExam);
router.post('/create', isAuth, isTeacher, examController.postCreateExam);
router.get('/:id', isAuth, examController.getExam);
router.get('/:id/edit', isAuth, isTeacher, examController.getEditExam);
router.post('/:id/edit', isAuth, isTeacher, examController.postEditExam);
router.delete('/:id', isAuth, isTeacher, examController.deleteExam);
router.post('/:id/publish', isAuth, isTeacher, examController.publishExam);
router.post('/:id/start', isAuth, examController.startExam);

// Question routes
router.get('/:examId/questions', isAuth, questionController.getQuestions);
router.get('/:examId/questions/plan', isAuth, isTeacher, questionController.getPlanQuestions);
router.post('/:examId/questions/plan', isAuth, isTeacher, questionController.postPlanQuestions);
router.post('/:examId/questions/create-bulk', isAuth, isTeacher, questionController.postCreateBulkQuestions);
router.get('/:examId/questions/create', isAuth, isTeacher, questionController.getCreateQuestion);
router.post('/:examId/questions/create', isAuth, isTeacher, questionController.postCreateQuestion);
router.get('/:examId/questions/:id', isAuth, questionController.getQuestion);
router.get('/:examId/questions/:id/edit', isAuth, isTeacher, questionController.getEditQuestion);
router.post('/:examId/questions/:id/edit', isAuth, isTeacher, questionController.postEditQuestion);
router.delete('/:examId/questions/:id', isAuth, isTeacher, questionController.deleteQuestion);
router.post('/:examId/questions/:id/upload-image', isAuth, isTeacher, questionController.postUploadImage);

// Exam attempt routes
router.get('/:id/attempt/:attemptId', isAuth, examController.getExamAttempt);
router.post('/:id/attempt/:attemptId/submit', isAuth, examController.submitExamAttempt);
router.post('/:id/attempt/:attemptId/grade', isAuth, isTeacher, examController.gradeExamAttempt);

module.exports = router; 