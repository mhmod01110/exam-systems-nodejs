const Exam = require('../models/Exam');
const Result = require('../models/Result');
const User = require('../models/User');
const Question = require('../models/Question');
const Submission = require('../models/Submission');

exports.getHome = async (req, res) => {
    try {
        // If user is not logged in, render the guest view
        if (!req.session.user) {
            return res.render('index', {
                title: 'Welcome to Online Exam System',
                user: null
            });
        }

        // For students
        if (req.session.user.role === 'student') {
            // Get upcoming exams (published exams that haven't started yet)
            const upcomingExams = await Exam.find({
                status: 'PUBLISHED',
                startDate: { $gt: new Date() }
            }).sort({ startDate: 1 }).limit(5);
        
            // Get recent results
            const recentResults = await Result.find({
                studentId: req.session.user._id
            })
            .populate('examId', 'title')
            .sort({ submittedAt: -1 })
            .limit(5)
            .lean();
        
            // Format results
            const formattedResults = recentResults.map(result => ({
                ...result,
                examTitle: result.examId.title
            }));
        
            return res.render('index', {
                title: 'Student Dashboard',
                user: req.session.user, // <-- Updated here
                upcomingExams,
                recentResults: formattedResults
            });
        }
        
        // For teachers and admins
        let query = {};
        
        // If teacher, only show their exams
        if (req.session.user.role === 'teacher') {
            query.createdBy = req.session.user._id;
        }

        // Get recent exams
        const recentExams = await Exam.find(query)
            .populate('questions')
            .populate('submissions')
            .sort({ createdAt: -1 })
            .limit(5);

        // Calculate statistics based on role
        let stats = {};
        
        if (req.session.user.role === 'teacher') {
            // For teachers - only their exams and related data
            const teacherExams = await Exam.find({ createdBy: req.session.user._id });
            const examIds = teacherExams.map(exam => exam._id);
            
            stats = {
                totalExams: await Exam.countDocuments({ createdBy: req.session.user._id }),
                totalQuestions: await Question.countDocuments({ examId: { $in: examIds } }),
                totalSubmissions: await Submission.countDocuments({ examId: { $in: examIds } })
            };
        } else if (req.session.user.role === 'admin') {
            // For admins - all system statistics
            stats = {
                totalExams: await Exam.countDocuments(),
                totalQuestions: await Question.countDocuments(),
                totalSubmissions: await Submission.countDocuments(),
                totalUsers: await User.countDocuments()
            };
        }

        return res.render('index', {
            title: `${req.session.user.role === 'admin' ? 'Admin' : 'Teacher'} Dashboard`,
            user: req.session.user,
            recentExams,
            ...stats // Spread the stats object to pass all statistics
        });

    } catch (error) {
        console.error('Error in getHome:', error);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/');
    }
}; 