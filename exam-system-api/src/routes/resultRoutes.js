const express = require('express');
const resultController = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(protect, authorize('admin'), resultController.getResults);

router
    .route('/:id')
    .get(protect, resultController.getResult)
    .put(protect, authorize('examiner', 'supervisor', 'admin'), resultController.updateResult);

router
    .route('/exam/:examId')
    .get(protect, authorize('examiner', 'supervisor', 'admin'), resultController.getExamResults);

router
    .route('/student/:studentId')
    .get(protect, resultController.getStudentResults);

router
    .route('/exam/:examId/analytics')
    .get(protect, authorize('examiner', 'supervisor', 'admin'), resultController.getExamAnalytics);

module.exports = router; 