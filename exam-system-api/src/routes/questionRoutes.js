const express = require('express');

const questionController = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(protect, questionController.getQuestions)
    .post(protect, authorize('examiner', 'supervisor', 'admin'), questionController.createQuestion);

router
    .route('/:id')
    .get(protect, questionController.getQuestion)
    .put(protect, authorize('examiner', 'supervisor', 'admin'), questionController.updateQuestion)
    .delete(protect, authorize('examiner', 'supervisor', 'admin'), questionController.deleteQuestion);

router
    .route('/:id/image')
    .put(protect, authorize('examiner', 'supervisor', 'admin'), questionController.uploadQuestionImage);

module.exports = router;