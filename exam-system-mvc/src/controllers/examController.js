const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');

// Display list of all exams
exports.getExams = async (req, res) => {
    try {
        const query = {};
        
        // Filter by department if specified
        if (req.query.department) {
            query.department = req.query.department;
        }
        
        // Filter by status if specified
        if (req.query.status) {
            query.status = req.query.status;
        }
        
        // Filter by type if specified
        if (req.query.type) {
            query.type = req.query.type;
        }
        
        // For students, only show published exams they're allowed to take
        if (req.user.role === 'student') {
            query.status = 'published';
            query.$or = [
                { isPublic: true },
                { allowedStudents: req.user._id }
            ];
        }
        
        const exams = await Exam.find(query)
            .populate('createdBy', 'username firstName lastName')
            .populate('department', 'name')
            .sort({ startDate: 1 });
        
        res.render('exam/list', {
            title: 'Exams',
            exams,
            user: req.user,
            query: req.query
        });
    } catch (error) {
        console.error('Error in getExams:', error);
        req.flash('error', 'Error fetching exams');
        res.redirect('/');
    }
};

// Display exam creation form
exports.getCreateExam = async (req, res) => {
    try {
        // Only teachers and admins can create exams
        if (!['teacher', 'admin'].includes(req.user.role)) {
            req.flash('error', 'Not authorized to create exams');
            return res.redirect('/exams');
        }
        
        res.render('exam/create', {
            title: 'Create Exam',
            user: req.user
        });
    } catch (error) {
        console.error('Error in getCreateExam:', error);
        req.flash('error', 'Error loading exam form');
        res.redirect('/exams');
    }
};

// Handle exam creation
exports.postCreateExam = async (req, res) => {
    try {
        // Only teachers and admins can create exams
        if (!['teacher', 'admin'].includes(req.user.role)) {
            req.flash('error', 'Not authorized to create exams');
            return res.redirect('/exams');
        }

        // Convert checkbox values to boolean
        const formData = {
            ...req.body,
            isPublic: req.body.isPublic === 'on',
            shuffleQuestions: req.body.shuffleQuestions === 'on',
            showResults: req.body.showResults === 'on',
            status: 'DRAFT', // Always start as draft
            createdBy: req.user._id,
            questions: [] // Start with empty questions array
        };

        // Convert string numbers to actual numbers
        formData.duration = parseInt(formData.duration);
        formData.totalMarks = parseInt(formData.totalMarks);
        formData.passingMarks = parseInt(formData.passingMarks);
        formData.maxAttempts = parseInt(formData.maxAttempts);

        // Create exam
        const exam = await Exam.create(formData);
        
        req.flash('success', 'Exam created successfully');
        res.redirect(`/exams/${exam._id}`);
    } catch (error) {
        console.error('Error in postCreateExam:', error);
        req.flash('error', error.message || 'Error creating exam');
        res.redirect('/exams/create');
    }
};

// Display exam details
exports.getExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('createdBy', 'username firstName lastName')
            .populate('department', 'name')
            .populate('questions')
            .populate('allowedStudents', 'username firstName lastName');
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if user has permission to view this exam
        if (req.user.role === 'student') {
            if (exam.status !== 'published' || 
                (!exam.isPublic && !exam.allowedStudents.some(student => 
                    student._id.toString() === req.user._id.toString()))) {
                req.flash('error', 'Not authorized to view this exam');
                return res.redirect('/exams');
            }
        }
        
        // Get user's attempts if they're a student
        let attempts = [];
        if (req.user.role === 'student') {
            attempts = await ExamAttempt.find({
                exam: exam._id,
                student: req.user._id
            }).sort({ startTime: -1 });
        }
        
        res.render('exam/detail', {
            title: exam.title,
            exam,
            attempts,
            user: req.user
        });
    } catch (error) {
        console.error('Error in getExam:', error);
        req.flash('error', 'Error fetching exam details');
        res.redirect('/exams');
    }
};

// Display exam edit form
exports.getEditExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('department', 'name')
            .populate('allowedStudents', 'username firstName lastName');
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if user is authorized to edit
        if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to edit this exam');
            return res.redirect('/exams');
        }
        
        res.render('exam/edit', {
            title: `Edit ${exam.title}`,
            exam,
            user: req.user
        });
    } catch (error) {
        console.error('Error in getEditExam:', error);
        req.flash('error', 'Error fetching exam for editing');
        res.redirect('/exams');
    }
};

// Handle exam update
exports.postEditExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if user is authorized to edit
        if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to edit this exam');
            return res.redirect('/exams');
        }
        
        // Validate dates
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        
        if (endDate <= startDate) {
            req.flash('error', 'End date must be after start date');
            return res.redirect(`/exams/${exam._id}/edit`);
        }
        
        // Update exam
        await Exam.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        
        req.flash('success', 'Exam updated successfully');
        res.redirect(`/exams/${exam._id}`);
    } catch (error) {
        console.error('Error in postEditExam:', error);
        req.flash('error', error.message || 'Error updating exam');
        res.redirect(`/exams/${req.params.id}/edit`);
    }
};

// Handle exam deletion
exports.deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if user is authorized to delete
        if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to delete this exam');
            return res.redirect('/exams');
        }
        
        // Delete all questions associated with this exam
        await Question.deleteMany({ examId: exam._id });
        
        // Delete all attempts associated with this exam
        await ExamAttempt.deleteMany({ exam: exam._id });
        
        // Delete the exam
        await exam.remove();
        
        req.flash('success', 'Exam deleted successfully');
        res.redirect('/exams');
    } catch (error) {
        console.error('Error in deleteExam:', error);
        req.flash('error', 'Error deleting exam');
        res.redirect('/exams');
    }
};

// Handle exam publication
exports.publishExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if user is authorized to publish
        if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to publish this exam');
            return res.redirect('/exams');
        }
        
        // Check if exam has questions
        const questionCount = await Question.countDocuments({ examId: exam._id });
        if (questionCount === 0) {
            req.flash('error', 'Cannot publish exam without questions');
            return res.redirect(`/exams/${exam._id}`);
        }
        
        // Update exam status
        exam.status = 'published';
        await exam.save();
        
        req.flash('success', 'Exam published successfully');
        res.redirect(`/exams/${exam._id}`);
    } catch (error) {
        console.error('Error in publishExam:', error);
        req.flash('error', 'Error publishing exam');
        res.redirect(`/exams/${req.params.id}`);
    }
};

// Start exam attempt
exports.startExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('questions');
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if exam is published
        if (exam.status !== 'published') {
            req.flash('error', 'This exam is not available');
            return res.redirect('/exams');
        }
        
        // Check if student is allowed to take this exam
        if (!exam.isPublic && !exam.allowedStudents.includes(req.user._id)) {
            req.flash('error', 'You are not authorized to take this exam');
            return res.redirect('/exams');
        }
        
        // Check if exam is within the time window
        const now = new Date();
        if (now < exam.startDate || now > exam.endDate) {
            req.flash('error', 'This exam is not currently available');
            return res.redirect('/exams');
        }
        
        // Check if student has exceeded maximum attempts
        const attemptCount = await ExamAttempt.countDocuments({
            exam: exam._id,
            student: req.user._id
        });
        
        if (attemptCount >= exam.maxAttempts) {
            req.flash('error', 'You have exceeded the maximum number of attempts for this exam');
            return res.redirect(`/exams/${exam._id}`);
        }
        
        // Create new attempt
        const attempt = await ExamAttempt.create({
            exam: exam._id,
            student: req.user._id,
            startTime: now,
            endTime: new Date(now.getTime() + exam.duration * 60000), // Convert duration to milliseconds
            questions: exam.questions.map(q => ({
                question: q._id,
                answer: '',
                marks: 0
            }))
        });
        
        res.redirect(`/exams/${exam._id}/attempt/${attempt._id}`);
    } catch (error) {
        console.error('Error in startExam:', error);
        req.flash('error', 'Error starting exam');
        res.redirect(`/exams/${req.params.id}`);
    }
};

// Display exam attempt
exports.getExamAttempt = async (req, res) => {
    try {
        const attempt = await ExamAttempt.findById(req.params.attemptId)
            .populate('exam')
            .populate({
                path: 'questions.question',
                populate: {
                    path: 'options'
                }
            });
        
        if (!attempt) {
            req.flash('error', 'Exam attempt not found');
            return res.redirect('/exams');
        }
        
        // Check if this attempt belongs to the student
        if (attempt.student.toString() !== req.user._id.toString()) {
            req.flash('error', 'Not authorized to view this attempt');
            return res.redirect('/exams');
        }
        
        // Check if attempt is still valid
        const now = new Date();
        if (now > attempt.endTime) {
            attempt.status = 'submitted';
            await attempt.save();
            req.flash('error', 'Exam time has expired');
            return res.redirect(`/exams/${attempt.exam._id}`);
        }
        
        res.render('exam/attempt', {
            title: `${attempt.exam.title} - Attempt`,
            attempt,
            user: req.user,
            timeRemaining: attempt.endTime - now
        });
    } catch (error) {
        console.error('Error in getExamAttempt:', error);
        req.flash('error', 'Error loading exam attempt');
        res.redirect('/exams');
    }
};

// Submit exam attempt
exports.submitExamAttempt = async (req, res) => {
    try {
        const attempt = await ExamAttempt.findById(req.params.attemptId)
            .populate('exam')
            .populate('questions.question');
        
        if (!attempt) {
            req.flash('error', 'Exam attempt not found');
            return res.redirect('/exams');
        }
        
        // Check if this attempt belongs to the student
        if (attempt.student.toString() !== req.user._id.toString()) {
            req.flash('error', 'Not authorized to submit this attempt');
            return res.redirect('/exams');
        }
        
        // Check if attempt is already submitted
        if (attempt.status === 'submitted') {
            req.flash('error', 'This attempt has already been submitted');
            return res.redirect(`/exams/${attempt.exam._id}`);
        }
        
        // Process answers and calculate marks
        let totalMarks = 0;
        
        for (const questionAnswer of attempt.questions) {
            const question = questionAnswer.question;
            const answer = req.body[`answer_${question._id}`];
            
            questionAnswer.answer = answer;
            
            // Auto-grade MCQ and True/False questions
            if (['MCQ', 'TrueFalse'].includes(question.type)) {
                if (question.type === 'MCQ') {
                    const correctOption = question.options.find(opt => opt.isCorrect);
                    questionAnswer.marks = answer === correctOption._id.toString() ? question.marks : 0;
                } else {
                    questionAnswer.marks = answer.toLowerCase() === question.correctAnswer.toLowerCase() ? 
                        question.marks : 0;
                }
                totalMarks += questionAnswer.marks;
            }
        }
        
        // Update attempt
        attempt.status = 'submitted';
        attempt.submittedAt = new Date();
        attempt.totalMarks = totalMarks;
        await attempt.save();
        
        req.flash('success', 'Exam submitted successfully');
        res.redirect(`/exams/${attempt.exam._id}`);
    } catch (error) {
        console.error('Error in submitExamAttempt:', error);
        req.flash('error', 'Error submitting exam');
        res.redirect(`/exams/${req.params.id}/attempt/${req.params.attemptId}`);
    }
};

// Grade exam attempt (for essay and short answer questions)
exports.gradeExamAttempt = async (req, res) => {
    try {
        const attempt = await ExamAttempt.findById(req.params.attemptId)
            .populate('exam')
            .populate('questions.question');
        
        if (!attempt) {
            req.flash('error', 'Exam attempt not found');
            return res.redirect('/exams');
        }
        
        // Check if user is authorized to grade
        if (attempt.exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to grade this attempt');
            return res.redirect('/exams');
        }
        
        let totalMarks = 0;
        
        // Update marks for each question
        for (const questionAnswer of attempt.questions) {
            const questionId = questionAnswer.question._id;
            const marks = Number(req.body[`marks_${questionId}`]);
            
            if (!isNaN(marks)) {
                questionAnswer.marks = Math.min(Math.max(marks, 0), questionAnswer.question.marks);
                totalMarks += questionAnswer.marks;
            }
        }
        
        attempt.totalMarks = totalMarks;
        attempt.gradedBy = req.user._id;
        attempt.gradedAt = new Date();
        await attempt.save();
        
        req.flash('success', 'Exam graded successfully');
        res.redirect(`/exams/${attempt.exam._id}/attempts`);
    } catch (error) {
        console.error('Error in gradeExamAttempt:', error);
        req.flash('error', 'Error grading exam');
        res.redirect(`/exams/${req.params.id}/attempts`);
    }
}; 