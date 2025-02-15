const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const Submission = require('../models/Submission');
const Result = require('../models/Result');
const AppError = require('../utils/AppError');

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
            query.status = 'PUBLISHED';
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
            .populate('allowedStudents', 'username firstName lastName')
            .exec();
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if user has permission to view this exam
        if (req.user.role === 'student') {
            if (exam.status !== 'PUBLISHED') {
                req.flash('error', 'Exam is not published, Not authorized to view this exam');
                return res.redirect('/exams');
            }
            // Only check allowedStudents if the exam is not public
            if (!exam.isPublic && !exam.allowedStudents.some(student => 
                student._id.toString() === req.user._id.toString())) {
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

// Handle exam publish
exports.publishExam = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id);
        
        if (!exam) {
            throw new AppError('Exam not found', 404);
        }
        
        // Check if user is authorized to publish
        if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            throw new AppError('Not authorized to publish this exam', 403);
        }

        // Check if exam has questions
        if (!exam.questions || exam.questions.length === 0) {
            throw new AppError('Cannot publish exam without questions', 400);
        }

        // Update exam status
        exam.status = 'PUBLISHED';
        await exam.save();
        
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.json({ 
                success: true, 
                message: 'Exam published successfully',
                status: 'PUBLISHED'
            });
        }

        req.flash('success', 'Exam published successfully');
        res.redirect(`/exams/${exam._id}`);
    } catch (error) {
        next(error);
    }
};

// Handle exam unpublish
exports.unpublishExam = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id);
        
        if (!exam) {
            throw new AppError('Exam not found', 404);
        }
        
        // Check if user is authorized to unpublish
        if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            throw new AppError('Not authorized to unpublish this exam', 403);
        }

        // Update exam status
        exam.status = 'DRAFT';
        await exam.save();
        
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.json({ 
                success: true, 
                message: 'Exam unpublished successfully',
                status: 'DRAFT'
            });
        }

        req.flash('success', 'Exam unpublished successfully');
        res.redirect(`/exams/${exam._id}`);
    } catch (error) {
        next(error);
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
        if (exam.status !== 'PUBLISHED') {
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
        
        // Get current attempt count and check maximum attempts
        const attemptCount = await ExamAttempt.countDocuments({
            exam: exam._id,
            student: req.user._id
        });
        
        if (attemptCount >= exam.maxAttempts) {
            req.flash('error', 'You have exceeded the maximum number of attempts for this exam');
            return res.redirect(`/exams/${exam._id}`);
        }
        
        // Create new attempt with attempt number
        const attempt = await ExamAttempt.create({
            exam: exam._id,
            student: req.user._id,
            startTime: now,
            endTime: new Date(now.getTime() + exam.duration * 60000), // Convert duration to milliseconds
            attemptNumber: attemptCount + 1, // Set the attempt number
            status: 'IN_PROGRESS',
            questions: exam.questions.map(q => ({
                question: q._id,
                answer: '',
                marks: 0
            }))
        });
        
        res.redirect(`/exams/${exam._id}/attempt/${attempt._id}`);
    } catch (error) {
        console.error('Error in startExam:', error);
        req.flash('error', 'Error starting exam: ' + error.message);
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
            attempt.status = 'EXPIRED';
            await attempt.save();
            req.flash('error', 'Exam time has expired');
            return res.redirect(`/exams/${attempt.exam._id}`);
        }
        
        // Shuffle questions if enabled
        if (attempt.exam.shuffleQuestions && attempt.status === 'IN_PROGRESS') {
            attempt.questions.sort(() => Math.random() - 0.5);
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
        .populate({
          path: 'exam',
          populate: { path: 'questions' } // Ensure questions are populated!
        })
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
        req.flash('error', 'Not authorized to submit this attempt');
        return res.redirect('/exams');
      }
  
      // Check if attempt is already submitted or expired
      if (attempt.status !== 'IN_PROGRESS') {
        req.flash('error', 'This attempt has already been submitted or expired');
        return res.redirect(`/exams/${attempt.exam._id}`);
      }
  
      // Check if attempt is still within time limit
      const now = new Date();
      if (now > attempt.endTime) {
        attempt.status = 'EXPIRED';
        await attempt.save();
        req.flash('error', 'Exam time has expired');
        return res.redirect(`/exams/${attempt.exam._id}`);
      }
  
      let totalMarks = 0;
      const mcqAnswers = []; // For MCQ questions (will include selectedOption)
      const tfAnswers = [];  // For True/False questions (use answer field)
  
      // Process answers and calculate marks for each question
      for (const questionAttempt of attempt.questions) {
        const question = questionAttempt.question;
        const answer = req.body[`answer_${question._id}`];
  
        if (!answer) continue;
  
        // Save the raw answer for reference
        questionAttempt.answer = answer;
        let isCorrect = false;
        let marksObtained = 0;
        let selectedOption = null;
  
        if (question.type === 'MCQ') {
          // For MCQ, compare the answer (option id) with the correct option's id
          const correctOption = question.options.find(opt => opt.isCorrect);
          selectedOption = answer; // answer is already the option ObjectId (as string)
          isCorrect = answer === correctOption._id.toString();
          marksObtained = isCorrect ? question.marks : 0;
  
          mcqAnswers.push({
            questionId: question._id,
            selectedOption, // This will satisfy the Submission schema
            isCorrect,
            marksObtained,
            timeSpent: 0 // Track if needed
          });
          totalMarks += marksObtained;
        } else if (question.type === 'TrueFalse') {
          // For True/False, compare the provided answer with the correctAnswer string
          console.log("Processing True/False Question:", question.text);
          console.log("Correct Answer:", question.correctAnswer);
          console.log("User Answer:", answer);
  
          // Normalize the answers
          isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
          marksObtained = isCorrect ? question.marks : 0;
  
          tfAnswers.push({
            questionId: question._id,
            answer: answer.trim().toLowerCase(), // Store the T/F answer directly
            isCorrect,
            marksObtained,
            timeSpent: 0 // Track if needed
          });
          totalMarks += marksObtained;
        }
  
        // Update the attempt's question marks
        questionAttempt.marks = marksObtained;
      }
  
      // Create submission record.
      // Here, we assume your Submission schema has been updated to include a separate field for tfAnswers.
      const submission = await Submission.create({
        examId: attempt.exam._id,
        studentId: req.user._id,
        submissionType: 'MIXED', // Indicate that there are both MCQ and True/False questions
        attemptNumber: attempt.attemptNumber,
        answers: mcqAnswers,  // MCQ answers (with selectedOption)
        tfAnswers: tfAnswers, // True/False answers (with answer)
        status: 'SUBMITTED',
        totalMarksObtained: totalMarks,
        submittedAt: now,
        startedAt: attempt.startTime,
        completedAt: now,
        ipAddress: req.ip,
        browserInfo: req.headers['user-agent'],
        isLate: now > attempt.exam.endDate
      });
  
      // Update exam attempt
      attempt.status = 'SUBMITTED';
      attempt.submittedAt = now;
      attempt.totalMarks = totalMarks;
      await attempt.save();
  
      console.log("Whole Exam total marks: ", attempt.exam.totalMarks);
      console.log("Total marks obtained: ", totalMarks);
  
      // For result creation, combine both types of answers.
      const combinedAnswers = [
        ...mcqAnswers,
        ...tfAnswers.map(tf => ({
          questionId: tf.questionId,
          marksObtained: tf.marksObtained,
          isCorrect: tf.isCorrect,
          timeTaken: tf.timeSpent,
          answer: tf.answer // Include the raw answer for True/False if needed
        }))
      ];
  
      const result = await Result.create({
        examId: attempt.exam._id,
        studentId: req.user._id,
        submissionId: submission._id,
        totalMarks: attempt.exam.totalMarks,
        obtainedMarks: totalMarks,
        percentage: (totalMarks / attempt.exam.totalMarks) * 100,
        status: totalMarks >= attempt.exam.passingMarks ? 'PASS' : 'FAIL',
        questionResults: combinedAnswers.map(answer => ({
          questionId: answer.questionId,
          obtainedMarks: answer.marksObtained,
          totalMarks: attempt.questions.find(q =>
            q.question._id.toString() === answer.questionId.toString()
          ).question.marks,
          isCorrect: answer.isCorrect,
          timeTaken: answer.timeTaken
        })),
        analytics: {
          timeSpent: Math.floor((now - attempt.startTime) / 1000),
          attemptsCount: attempt.attemptNumber,
          correctAnswers: combinedAnswers.filter(a => a.isCorrect).length,
          incorrectAnswers: combinedAnswers.filter(a => !a.isCorrect).length,
          skippedQuestions: attempt.questions.length - combinedAnswers.length,
          accuracyRate: combinedAnswers.length > 0 ?
            (combinedAnswers.filter(a => a.isCorrect).length / combinedAnswers.length) * 100 : 0
        }
      });
  
      req.flash('success', 'Exam submitted successfully');
      res.redirect(`/exams/${attempt.exam._id}`);
    } catch (error) {
      console.error('Error in submitExamAttempt:', error);
      req.flash('error', 'Error submitting exam: ' + error.message);
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