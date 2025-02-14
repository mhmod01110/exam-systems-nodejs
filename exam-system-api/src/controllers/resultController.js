const Result = require('../models/result');
const Exam = require('../models/exam');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all results
// @route   GET /api/results
// @access  Private (Admin)
exports.getResults = async (req, res, next) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);

        // Create query string
        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Finding resource
        query = Result.find(JSON.parse(queryStr));

        // Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Result.countDocuments();

        query = query.skip(startIndex).limit(limit);

        // Populate
        query = query.populate([
            { path: 'examId', select: 'title type' },
            { path: 'studentId', select: 'username firstName lastName' },
            { path: 'evaluatedBy', select: 'username firstName lastName' }
        ]);

        // Executing query
        const results = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: results.length,
            pagination,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single result
// @route   GET /api/results/:id
// @access  Private
exports.getResult = async (req, res, next) => {
    try {
        const result = await Result.findById(req.params.id)
            .populate('examId', 'title type totalMarks passingMarks')
            .populate('studentId', 'username firstName lastName')
            .populate('evaluatedBy', 'username firstName lastName');

        if (!result) {
            return next(new ErrorResponse(`No result found with id of ${req.params.id}`, 404));
        }

        // Check if user is authorized to view result
        if (
            result.studentId._id.toString() !== req.user.id && // Student's own result
            req.user.role !== 'admin' && // Admin
            result.examId.createdBy.toString() !== req.user.id // Exam creator
        ) {
            return next(new ErrorResponse(`Not authorized to view this result`, 401));
        }

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get exam results
// @route   GET /api/exams/:examId/results
// @access  Private (Examiner, Supervisor, Admin)
exports.getExamResults = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.examId);

        if (!exam) {
            return next(new ErrorResponse(`No exam found with id of ${req.params.examId}`, 404));
        }

        // Check if user is authorized to view results
        if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`Not authorized to view results for this exam`, 401));
        }

        const results = await Result.find({ examId: req.params.examId })
            .populate('studentId', 'username firstName lastName')
            .populate('evaluatedBy', 'username firstName lastName')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get student results
// @route   GET /api/students/:studentId/results
// @access  Private
exports.getStudentResults = async (req, res, next) => {
    try {
        // Check if user is authorized to view results
        if (req.params.studentId !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`Not authorized to view these results`, 401));
        }

        const results = await Result.find({ studentId: req.params.studentId })
            .populate('examId', 'title type totalMarks passingMarks')
            .populate('evaluatedBy', 'username firstName lastName')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get exam analytics
// @route   GET /api/exams/:examId/analytics
// @access  Private (Examiner, Supervisor, Admin)
exports.getExamAnalytics = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.examId);

        if (!exam) {
            return next(new ErrorResponse(`No exam found with id of ${req.params.examId}`, 404));
        }

        // Check if user is authorized to view analytics
        if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`Not authorized to view analytics for this exam`, 401));
        }

        const results = await Result.find({ examId: req.params.examId });

        // Calculate analytics
        const analytics = {
            totalStudents: results.length,
            passCount: results.filter(r => r.status === 'PASS').length,
            failCount: results.filter(r => r.status === 'FAIL').length,
            averageScore: results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length || 0,
            highestScore: Math.max(...results.map(r => r.percentage)),
            lowestScore: Math.min(...results.map(r => r.percentage)),
            gradeDistribution: {
                'A+': results.filter(r => r.grade === 'A+').length,
                'A': results.filter(r => r.grade === 'A').length,
                'B+': results.filter(r => r.grade === 'B+').length,
                'B': results.filter(r => r.grade === 'B').length,
                'C+': results.filter(r => r.grade === 'C+').length,
                'C': results.filter(r => r.grade === 'C').length,
                'D': results.filter(r => r.grade === 'D').length,
                'F': results.filter(r => r.grade === 'F').length
            },
            questionAnalytics: []
        };

        // Calculate question-wise analytics
        if (results.length > 0 && results[0].questionResults) {
            const questionMap = new Map();

            results.forEach(result => {
                result.questionResults.forEach(qr => {
                    if (!questionMap.has(qr.questionId.toString())) {
                        questionMap.set(qr.questionId.toString(), {
                            questionId: qr.questionId,
                            totalAttempts: 0,
                            correctAttempts: 0,
                            averageTimeTaken: 0,
                            totalTimeTaken: 0
                        });
                    }

                    const stats = questionMap.get(qr.questionId.toString());
                    stats.totalAttempts++;
                    if (qr.isCorrect) stats.correctAttempts++;
                    stats.totalTimeTaken += qr.timeTaken || 0;
                });
            });

            questionMap.forEach(stats => {
                stats.averageTimeTaken = stats.totalTimeTaken / stats.totalAttempts;
                stats.difficultyLevel = (stats.correctAttempts / stats.totalAttempts) * 100;
                analytics.questionAnalytics.push(stats);
            });
        }

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update result (for appeals)
// @route   PUT /api/results/:id
// @access  Private (Examiner, Supervisor, Admin)
exports.updateResult = async (req, res, next) => {
    try {
        let result = await Result.findById(req.params.id);

        if (!result) {
            return next(new ErrorResponse(`No result found with id of ${req.params.id}`, 404));
        }

        // Check if user is authorized to update result
        const exam = await Exam.findById(result.examId);
        if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`Not authorized to update this result`, 401));
        }

        // Update result
        result = await Result.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};