const express = require('express');

const examController = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

// Include other resource routers
const questionRouter = require('./questionRoutes');
const submissionRouter = require('./submissionRoutes');
const resultRouter = require('./resultRoutes');

const router = express.Router();

// Re-route into other resource routers
router.use('/:examId/questions', questionRouter);
router.use('/:examId/submissions', submissionRouter);
router.use('/:examId/results', resultRouter);

router
    .route('/')
    .get(protect, examController.getExams)
    .post(protect, authorize('examiner', 'supervisor', 'admin'), examController.createExam);

router
    .route('/:id')
    .get(protect, examController.getExam)
    .put(protect, authorize('examiner', 'supervisor', 'admin'), examController.updateExam)
    .delete(protect, authorize('examiner', 'supervisor', 'admin'), examController.deleteExam);

router
    .route('/:id/students')
    .get(protect, authorize('examiner', 'supervisor', 'admin'), examController.getEnrolledStudents);

router
    .route('/:id/enroll')
    .post(protect, authorize('examiner', 'supervisor', 'admin'), examController.enrollStudents);

router
    .route('/:id/unenroll')
    .delete(protect, authorize('examiner', 'supervisor', 'admin'), examController.removeStudents);

router
    .route('/:id/start')
    .put(protect, authorize('examiner', 'supervisor', 'admin'), examController.startExam);

router
    .route('/:id/end')
    .put(protect, authorize('examiner', 'supervisor', 'admin'), examController.endExam);

module.exports = router;