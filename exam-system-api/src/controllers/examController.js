const Exam = require('../models/exam');
const Question = require('../models/question');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Examiner, Supervisor, Admin)
exports.createExam = async (req, res, next) => {
    try {
        req.body.createdBy = req.user.id;
        
        const exam = await Exam.create(req.body);
        
        res.status(201).json({
            success: true,
            data: exam
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
exports.getExams = async (req, res, next) => {
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
        query = Exam.find(JSON.parse(queryStr));

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
        const total = await Exam.countDocuments();

        query = query.skip(startIndex).limit(limit);

        // Populate
        query = query.populate([
            { path: 'createdBy', select: 'username firstName lastName' },
            { path: 'questions', select: 'questionText type marks' }
        ]);

        // Executing query
        const exams = await query;

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
            count: exams.length,
            pagination,
            data: exams
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
exports.getExam = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id).populate([
            { path: 'createdBy', select: 'username firstName lastName' },
            { path: 'questions', select: 'questionText type marks' }
        ]);

        if (!exam) {
            return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: exam
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Examiner, Supervisor, Admin)
exports.updateExam = async (req, res, next) => {
    try {
        let exam = await Exam.findById(req.params.id);

        if (!exam) {
            return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
        }

        // Make sure user is exam creator or admin
        if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this exam`, 401));
        }

        // Don't allow status change if exam has submissions
        if (req.body.status && exam.status === 'IN_PROGRESS') {
            return next(new ErrorResponse('Cannot modify exam while it is in progress', 400));
        }

        exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: exam
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Examiner, Supervisor, Admin)
exports.deleteExam = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
        }

        // Make sure user is exam creator or admin
        if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this exam`, 401));
        }

        // Check if exam can be deleted
        if (exam.status !== 'DRAFT' && exam.status !== 'COMPLETED') {
            return next(new ErrorResponse(`Cannot delete exam in ${exam.status} status`, 400));
        }

        await exam.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get enrolled students
// @route   GET /api/exams/:id/students
// @access  Private (Examiner, Supervisor, Admin)
exports.getEnrolledStudents = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id).populate({
            path: 'allowedStudents',
            select: 'username firstName lastName email'
        });

        if (!exam) {
            return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            count: exam.allowedStudents.length,
            data: exam.allowedStudents
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Enroll students in exam
// @route   POST /api/exams/:id/enroll
// @access  Private (Examiner, Supervisor, Admin)
exports.enrollStudents = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
        }

        // Make sure user is exam creator or admin
        if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User ${req.user.id} is not authorized to enroll students`, 401));
        }

        // Add students to allowed list
        exam.allowedStudents = [...new Set([...exam.allowedStudents, ...req.body.students])];
        await exam.save();

        res.status(200).json({
            success: true,
            data: exam
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove students from exam
// @route   DELETE /api/exams/:id/unenroll
// @access  Private (Examiner, Supervisor, Admin)
exports.removeStudents = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
        }

        // Make sure user is exam creator or admin
        if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User ${req.user.id} is not authorized to remove students`, 401));
        }

        // Remove students from allowed list
        exam.allowedStudents = exam.allowedStudents.filter(
            student => !req.body.students.includes(student.toString())
        );
        await exam.save();

        res.status(200).json({
            success: true,
            data: exam
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Start exam
// @route   PUT /api/exams/:id/start
// @access  Private (Examiner, Supervisor, Admin)
exports.startExam = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
        }

        // Check if exam can be started
        if (exam.status !== 'PUBLISHED') {
            return next(new ErrorResponse(`Cannot start exam in ${exam.status} status`, 400));
        }

        // Update exam status
        exam.status = 'IN_PROGRESS';
        await exam.save();

        res.status(200).json({
            success: true,
            data: exam
        });
    } catch (error) {
        next(error);
    }
};

// @desc    End exam
// @route   PUT /api/exams/:id/end
// @access  Private (Examiner, Supervisor, Admin)
exports.endExam = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
        }

        // Check if exam can be ended
        if (exam.status !== 'IN_PROGRESS') {
            return next(new ErrorResponse(`Cannot end exam in ${exam.status} status`, 400));
        }

        // Update exam status
        exam.status = 'COMPLETED';
        await exam.save();

        res.status(200).json({
            success: true,
            data: exam
        });
    } catch (error) {
        next(error);
    }
};