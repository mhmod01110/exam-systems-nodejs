const Exam = require('../models/Exam');
const Result = require('../models/Result');
const User = require('../models/User');
const Question = require('../models/Question');

exports.getHome = async (req, res) => {
    try {
        // If user is not logged in, render the guest view
        if (!req.user) {
            return res.render('index', {
                title: 'Welcome'
            });
        }

        // For students
        if (req.user.role === 'student') {
            // Get upcoming exams (published exams that haven't started yet)
            const upcomingExams = await Exam.find({
                isPublished: true,
                startTime: { $gt: new Date() }
            }).sort({ startTime: 1 }).limit(5);

            // Get recent results
            const recentResults = await Result.find({
                studentId: req.user._id
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
                upcomingExams,
                recentResults: formattedResults
            });
        }

        // For teachers and admins
        // Get recent exams created by the user
        const recentExams = await Exam.find({
            createdBy: req.user._id
        })
        .populate('questions')
        .populate('submissions')
        .sort({ createdAt: -1 })
        .limit(5);

        // Get statistics
        const stats = {
            totalExams: await Exam.countDocuments({ createdBy: req.user._id }),
            totalQuestions: await Question.countDocuments({ createdBy: req.user._id }),
            totalSubmissions: await Result.countDocuments({ examId: { $in: recentExams.map(e => e._id) } })
        };

        // Add total users count for admins
        if (req.user.role === 'admin') {
            stats.totalUsers = await User.countDocuments();
        }

        return res.render('index', {
            title: `${req.user.role === 'admin' ? 'Admin' : 'Teacher'} Dashboard`,
            recentExams,
            totalExams: stats.totalExams,
            totalQuestions: stats.totalQuestions,
            totalSubmissions: stats.totalSubmissions,
            totalUsers: stats.totalUsers
        });

    } catch (error) {
        console.error('Error in getHome:', error);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/');
    }
}; 