const Question = require('../models/question');
const Exam = require('../models/exam');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');

// @desc    Create new question
// @route   POST /api/exams/:examId/questions
// @access  Private (Examiner, Supervisor, Admin)
exports.createQuestion = async (req, res, next) => {
    try {
        req.body.examId = req.params.examId;
        req.body.createdBy = req.user.id;

        const exam = await Exam.findById(req.params.examId);

        if (!exam) {
            return next(new ErrorResponse(`No exam found with id of ${req.params.examId}`, 404));
        }

        // Make sure user is exam creator or admin
        if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User ${req.user.id} is not authorized to add questions to this exam`, 401));
        }

        // Validate MCQ options if question type is MCQ
        if (req.body.type === 'MCQ') {
            if (!req.body.options || req.body.options.length < 2) {
                return next(new ErrorResponse('MCQ questions must have at least 2 options', 400));
            }

            const correctOptions = req.body.options.filter(opt => opt.isCorrect);
            if (correctOptions.length !== 1) {
                return next(new ErrorResponse('MCQ questions must have exactly one correct answer', 400));
            }
        }

        // Create question
        const question = await Question.create(req.body);

        // Add question to exam
        exam.questions.push(question._id);
        await exam.save();

        res.status(201).json({
            success: true,
            data: question
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all questions for an exam
// @route   GET /api/exams/:examId/questions
// @access  Private
exports.getQuestions = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.examId);

        if (!exam) {
            return next(new ErrorResponse(`No exam found with id of ${req.params.examId}`, 404));
        }

        const questions = await Question.find({ examId: req.params.examId })
            .populate('createdBy', 'username firstName lastName');

        res.status(200).json({
            success: true,
            count: questions.length,
            data: questions
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Private
exports.getQuestion = async (req, res, next) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate('createdBy', 'username firstName lastName')
            .populate('examId', 'title type');

        if (!question) {
            return next(new ErrorResponse(`No question found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: question
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Examiner, Supervisor, Admin)
exports.updateQuestion = async (req, res, next) => {
    try {
        let question = await Question.findById(req.params.id);

        if (!question) {
            return next(new ErrorResponse(`No question found with id of ${req.params.id}`, 404));
        }

        // Make sure user is question creator or admin
        if (question.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this question`, 401));
        }

        // Validate MCQ options if updating them
        if (req.body.options && question.type === 'MCQ') {
            if (req.body.options.length < 2) {
                return next(new ErrorResponse('MCQ questions must have at least 2 options', 400));
            }

            const correctOptions = req.body.options.filter(opt => opt.isCorrect);
            if (correctOptions.length !== 1) {
                return next(new ErrorResponse('MCQ questions must have exactly one correct answer', 400));
            }
        }

        question = await Question.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: question
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Examiner, Supervisor, Admin)
exports.deleteQuestion = async (req, res, next) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return next(new ErrorResponse(`No question found with id of ${req.params.id}`, 404));
        }

        // Make sure user is question creator or admin
        if (question.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this question`, 401));
        }

        // Remove question from exam
        const exam = await Exam.findById(question.examId);
        if (exam) {
            exam.questions = exam.questions.filter(q => q.toString() !== question._id.toString());
            await exam.save();
        }

        await question.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload question image
// @route   PUT /api/questions/:id/image
// @access  Private (Examiner, Supervisor, Admin)
exports.uploadQuestionImage = async (req, res, next) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return next(new ErrorResponse(`No question found with id of ${req.params.id}`, 404));
        }

        // Make sure user is question creator or admin
        if (question.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this question`, 401));
        }

        if (!req.files) {
            return next(new ErrorResponse(`Please upload a file`, 400));
        }

        const file = req.files.file;

        // Make sure the image is a photo
        if (!file.mimetype.startsWith('image')) {
            return next(new ErrorResponse(`Please upload an image file`, 400));
        }

        // Check filesize
        if (file.size > process.env.MAX_FILE_UPLOAD) {
            return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));
        }

        // Create custom filename
        file.name = `question_${question._id}${path.parse(file.name).ext}`;

        // Upload file
        file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
            if (err) {
                console.error(err);
                return next(new ErrorResponse(`Problem with file upload`, 500));
            }

            // Add image to question
            question.images.push({
                url: file.name,
                caption: req.body.caption || ''
            });
            await question.save();

            res.status(200).json({
                success: true,
                data: question
            });
        });
    } catch (error) {
        next(error);
    }
};