const User = require('../models/User');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const Result = require('../models/Result');

// Get Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const data = {
            title: 'Dashboard'
        };

        if (req.user.role === 'student') {
            // Get student's upcoming exams
            data.upcomingExams = await Exam.find({
                status: 'PUBLISHED',
                startDate: { $gt: new Date() },
                $or: [
                    { isPublic: true },
                    { allowedStudents: req.user._id }
                ]
            }).limit(5);

            // Get recent results
            data.recentResults = await Result.find({
                studentId: req.user._id
            })
            .populate('examId', 'title')
            .sort({ createdAt: -1 })
            .limit(5);
        } else if (req.user.role === 'teacher' || req.user.role === 'admin') {
            // Get teacher's exams
            data.exams = await Exam.find({
                createdBy: req.user._id
            })
            .sort({ createdAt: -1 })
            .limit(5);

            // Get pending evaluations
            data.pendingEvaluations = await Submission.find({
                'exam.createdBy': req.user._id,
                status: 'SUBMITTED'
            })
            .populate('studentId', 'name')
            .populate('examId', 'title')
            .limit(5);
        }

        res.render('dashboard', data);
    } catch (error) {
        console.error('Dashboard error:', error);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/');
    }
};

// Get Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.render('profile', {
            title: 'Profile',
            user
        });
    } catch (error) {
        console.error('Profile error:', error);
        req.flash('error', 'Error loading profile');
        res.redirect('/dashboard');
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        // Update basic info
        user.name = name;
        user.email = email;

        // Update password if provided
        if (currentPassword && newPassword) {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                req.flash('error', 'Current password is incorrect');
                return res.redirect('/profile');
            }
            user.password = newPassword;
        }

        await user.save();
        req.flash('success', 'Profile updated successfully');
        res.redirect('/profile');
    } catch (error) {
        console.error('Profile update error:', error);
        req.flash('error', error.message || 'Error updating profile');
        res.redirect('/profile');
    }
};

// Get My Exams (for students)
exports.getMyExams = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            req.flash('error', 'Access denied');
            return res.redirect('/dashboard');
        }

        const exams = await Exam.find({
            status: 'PUBLISHED',
            $or: [
                { isPublic: true },
                { allowedStudents: req.user._id }
            ]
        }).populate('createdBy', 'name');

        res.render('exam/my-exams', {
            title: 'My Exams',
            exams
        });
    } catch (error) {
        console.error('My exams error:', error);
        req.flash('error', 'Error loading exams');
        res.redirect('/dashboard');
    }
};

// Get Results (for students)
exports.getResults = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            req.flash('error', 'Access denied');
            return res.redirect('/dashboard');
        }

        const results = await Result.find({
            studentId: req.user._id
        })
        .populate('examId', 'title')
        .sort({ createdAt: -1 });

        res.render('exam/results', {
            title: 'My Results',
            results
        });
    } catch (error) {
        console.error('Results error:', error);
        req.flash('error', 'Error loading results');
        res.redirect('/dashboard');
    }
}; 