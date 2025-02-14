const express = require('express');
const submissionController = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(protect, authorize('examiner', 'supervisor', 'admin'), submissionController.getExamSubmissions)
    .post(protect, authorize('student'), submissionController.startSubmission);

router
    .route('/:id')
    .get(protect, submissionController.getSubmission);

router
    .route('/:id/mcq')
    .put(protect, authorize('student'), submissionController.submitMCQAnswers);

router
    .route('/:id/project')
    .put(protect, authorize('student'), submissionController.submitProject);

router
    .route('/:id/grade')
    .put(protect, authorize('examiner', 'supervisor'), submissionController.gradeProject);

module.exports = router;
