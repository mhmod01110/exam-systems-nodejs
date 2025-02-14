const path = require('path');
const Submission = require('../models/submission');
const Exam = require('../models/exam');
const Question = require('../models/question');
const Result = require('../models/result');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Start exam submission
// @route   POST /api/exams/:examId/submissions
// @access  Private (Student)
exports.startSubmission = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.examId);

        if (!exam) {
            return next(new ErrorResponse(`No exam found with id of ${req.params.examId}`, 404));
        }

        // Check if student is allowed to take exam
        if (!exam.isPublic && !exam.allowedStudents.includes(req.user.id)) {
            return next(new ErrorResponse(`You are not authorized to take this exam`, 401));
        }

        // Check exam status
        if (exam.status !== 'IN_PROGRESS') {
            return next(new ErrorResponse(`Exam is not currently active`, 400));
        }

        // Check if student has already started/submitted maximum attempts
        const attemptCount = await Submission.countDocuments({
            examId: exam._id,
            studentId: req.user.id
        });

        if (attemptCount >= exam.maxAttempts) {
            return next(new ErrorResponse(`Maximum attempts reached for this exam`, 400));
        }

        // Create submission
        const submission = await Submission.create({
            examId: exam._id,
            studentId: req.user.id,
            submissionType: exam.type,
            attemptNumber: attemptCount + 1,
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            ipAddress: req.ip,
            browserInfo: req.headers['user-agent']
        });

        res.status(201).json({
            success: true,
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit MCQ answers
// @route   PUT /api/submissions/:id/mcq
// @access  Private (Student)
exports.submitMCQAnswers = async (req, res, next) => {
    try {
        let submission = await Submission.findById(req.params.id);

        if (!submission) {
            return next(new ErrorResponse(`No submission found with id of ${req.params.id}`, 404));
        }

        // Check if submission belongs to student
        if (submission.studentId.toString() !== req.user.id) {
            return next(new ErrorResponse(`Not authorized to access this submission`, 401));
        }

        // Check submission type
        if (submission.submissionType !== 'MCQ') {
            return next(new ErrorResponse(`This submission is not of type MCQ`, 400));
        }

        // Validate and process answers
        const exam = await Exam.findById(submission.examId).populate('questions');
        const answers = [];
        let totalMarksObtained = 0;

        for (const answer of req.body.answers) {
            const question = exam.questions.find(q => q._id.toString() === answer.questionId);
            
            if (!question) {
                return next(new ErrorResponse(`Question not found: ${answer.questionId}`, 400));
            }

            const isCorrect = question.options.find(opt => opt._id.toString() === answer.selectedOption)?.isCorrect || false;
            const marksObtained = isCorrect ? question.marks : 0;
            totalMarksObtained += marksObtained;

            answers.push({
                questionId: answer.questionId,
                selectedOption: answer.selectedOption,
                isCorrect,
                marksObtained,
                timeSpent: answer.timeSpent || 0
            });
        }

        // Update submission
        submission.answers = answers;
        submission.totalMarksObtained = totalMarksObtained;
        submission.status = 'SUBMITTED';
        submission.submittedAt = new Date();
        submission = await submission.save();

        // Create result
        await Result.create({
            examId: submission.examId,
            studentId: submission.studentId,
            submissionId: submission._id,
            totalMarks: exam.totalMarks,
            obtainedMarks: totalMarksObtained,
            status: totalMarksObtained >= exam.passingMarks ? 'PASS' : 'FAIL',
            questionResults: answers.map(answer => ({
                questionId: answer.questionId,
                obtainedMarks: answer.marksObtained,
                totalMarks: exam.questions.find(q => q._id.toString() === answer.questionId).marks,
                isCorrect: answer.isCorrect,
                timeTaken: answer.timeSpent
            }))
        });

        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit project
// @route   PUT /api/submissions/:id/project
// @access  Private (Student)
exports.submitProject = async (req, res, next) => {
    try {
        let submission = await Submission.findById(req.params.id);

        if (!submission) {
            return next(new ErrorResponse(`No submission found with id of ${req.params.id}`, 404));
        }

        // Check if submission belongs to student
        if (submission.studentId.toString() !== req.user.id) {
            return next(new ErrorResponse(`Not authorized to access this submission`, 401));
        }

        // Check submission type
        if (submission.submissionType !== 'PROJECT') {
            return next(new ErrorResponse(`This submission is not of type PROJECT`, 400));
        }

        // Check if file is uploaded
        if (!req.files || !req.files.project) {
            return next(new ErrorResponse(`Please upload a project file`, 400));
        }

        const file = req.files.project;
        const exam = await Exam.findById(submission.examId);
        const question = await Question.findOne({ examId: exam._id, type: 'PROJECT' });

        // Validate file type
        if (!question.allowedFileExtensions.includes(path.extname(file.name).toLowerCase())) {
            return next(new ErrorResponse(`Please upload a valid file type`, 400));
        }

        // Check file size
        if (file.size > question.maxFileSize * 1024 * 1024) {
            return next(new ErrorResponse(`File size cannot exceed ${question.maxFileSize}MB`, 400));
        }

        // Create custom filename
        const fileName = `project_${submission._id}${path.extname(file.name)}`;

        // Upload file
        file.mv(`${process.env.FILE_UPLOAD_PATH}/${fileName}`, async err => {
            if (err) {
                console.error(err);
                return next(new ErrorResponse(`Problem with file upload`, 500));
            }

            // Update submission
            submission.projectSubmission = {
                fileUrl: fileName,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.mimetype,
                submittedAt: new Date()
            };
            submission.status = 'SUBMITTED';
            submission.submittedAt = new Date();
            submission = await submission.save();

            // Create result (pending review)
            await Result.create({
                examId: submission.examId,
                studentId: submission.studentId,
                submissionId: submission._id,
                totalMarks: exam.totalMarks,
                obtainedMarks: 0,
                status: 'PENDING_REVIEW'
            });

            res.status(200).json({
                success: true,
                data: submission
            });
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Grade project submission
// @route   PUT /api/submissions/:id/grade
// @access  Private (Examiner, Supervisor)
exports.gradeProject = async (req, res, next) => {
    try {
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return next(new ErrorResponse(`No submission found with id of ${req.params.id}`, 404));
        }

        // Check submission type
        if (submission.submissionType !== 'PROJECT') {
            return next(new ErrorResponse(`This submission is not of type PROJECT`, 400));
        }

        const exam = await Exam.findById(submission.examId);

        // Check if user is authorized to grade
        if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'supervisor') {
            return next(new ErrorResponse(`Not authorized to grade this submission`, 401));
        }

        // Update submission with grade
        submission.projectSubmission.marksObtained = req.body.marks;
        submission.projectSubmission.feedback = {
            text: req.body.feedback,
            givenAt: new Date(),
            givenBy: req.user.id
        };
        submission.totalMarksObtained = req.body.marks;
        submission.status = 'EVALUATED';
        await submission.save();

        // Update result
        const result = await Result.findOne({ submissionId: submission._id });
        result.obtainedMarks = req.body.marks;
        result.status = req.body.marks >= exam.passingMarks ? 'PASS' : 'FAIL';
        result.evaluatedBy = req.user.id;
        result.evaluatedAt = new Date();
        result.feedback = {
            general: req.body.feedback,
            givenBy: req.user.id,
            givenAt: new Date()
        };
        await result.save();

        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get submission by ID
// @route   GET /api/submissions/:id
// @access  Private
exports.getSubmission = async (req, res, next) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('examId', 'title type duration')
            .populate('studentId', 'username firstName lastName');

        if (!submission) {
            return next(new ErrorResponse(`No submission found with id of ${req.params.id}`, 404));
        }

        // Check if user is authorized to view submission
        if (
            submission.studentId._id.toString() !== req.user.id && // Student's own submission
            req.user.role !== 'admin' && // Admin
            submission.examId.createdBy.toString() !== req.user.id // Exam creator
        ) {
            return next(new ErrorResponse(`Not authorized to view this submission`, 401));
        }

        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all submissions for an exam
// @route   GET /api/exams/:examId/submissions
// @access  Private (Examiner, Supervisor, Admin)
exports.getExamSubmissions = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.examId);

        if (!exam) {
            return next(new ErrorResponse(`No exam found with id of ${req.params.examId}`, 404));
        }

        // Check if user is authorized to view submissions
        if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`Not authorized to view submissions for this exam`, 401));
        }

        const submissions = await Submission.find({ examId: req.params.examId })
            .populate('studentId', 'username firstName lastName')
            .sort('-submittedAt');

        res.status(200).json({
            success: true,
            count: submissions.length,
            data: submissions
        });
    } catch (error) {
        next(error);
    }
};
