const User = require('../models/User');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const Result = require('../models/Result');
const ExamAttempt = require('../models/ExamAttempt');

// Get Dashboard
exports.getDashboard = async (req, res) => {
    try {
      const user = req.user;
  
      // Initialize stats object
      let stats = {
        totalExams: 0,
        averageScore: 0,
        examsPassed: 0,
        examsFailed: 0
      };
  
      if (user.role === 'student') {
        // Get all results for this student
        const results = await Result.find({ studentId: user._id })
          .populate('examId');
  
        // Get all submissions for this student
        const submissions = await Submission.find({ studentId: user._id })
          .populate('examId');
  
        // Calculate statistics
        stats.totalExams = results.length;
        
        if (stats.totalExams > 0) {
          // Calculate average score
          const totalPercentage = results.reduce((sum, result) => sum + result.percentage, 0);
          stats.averageScore = (totalPercentage / stats.totalExams).toFixed(2);
  
          // Count passed and failed exams
          stats.examsPassed = results.filter(result => result.status === 'PASS').length;
          stats.examsFailed = results.filter(result => result.status === 'FAIL').length;
        }
  
        // Get recent exam attempts
        const recentAttempts = await ExamAttempt.find({ student: user._id })
          .populate('exam')
          .sort({ createdAt: -1 })
          .limit(5);
  
        // Get upcoming exams
        const upcomingExams = await Exam.find({
          status: 'PUBLISHED',
          startDate: { $gt: new Date() },
          $or: [
            { isPublic: true },
            { allowedStudents: user._id }
          ]
        }).limit(5);
  
        // --- Attach result to each recent attempt ---
        // Build a map for submissions keyed by "examId_attemptNumber"
        const submissionMap = {};
        submissions.forEach(sub => {
          // Ensure examId is populated; if not, use sub.examId directly
          const examId = sub.examId && sub.examId._id ? sub.examId._id.toString() : sub.examId.toString();
          const key = `${examId}_${sub.attemptNumber}`;
          submissionMap[key] = sub;
        });
  
        // Build a map for results keyed by submissionId
        const resultMap = {};
        results.forEach(result => {
          if (result.submissionId) {
            resultMap[result.submissionId.toString()] = result;
          }
        });
  
        // For each recent attempt, find its submission (matching exam and attemptNumber)
        // and then attach the corresponding result if it exists.
        recentAttempts.forEach(attempt => {
          const examId = attempt.exam && attempt.exam._id ? attempt.exam._id.toString() : attempt.exam.toString();
          const key = `${examId}_${attempt.attemptNumber}`;
          const submission = submissionMap[key];
          if (submission) {
            const result = resultMap[submission._id.toString()];
            if (result) {
              attempt.result = result;
            }
          }
        });
        // --- End attaching result ---
  
        res.render('dashboard', {
          title: 'Dashboard',
          user,
          stats,
          recentAttempts,
          upcomingExams,
          submissions,
          results
        });
      } else if (user.role === 'teacher') {
        // ... teacher code remains unchanged ...
        const exams = await Exam.find({ createdBy: user._id });
        stats.totalExams = exams.length;
  
        const results = await Result.find({
          examId: { $in: exams.map(exam => exam._id) }
        });
  
        if (results.length > 0) {
          const totalPercentage = results.reduce((sum, result) => sum + result.percentage, 0);
          stats.averageScore = (totalPercentage / results.length).toFixed(2);
          stats.examsPassed = results.filter(result => result.status === 'PASS').length;
          stats.examsFailed = results.filter(result => result.status === 'FAIL').length;
        }
  
        const recentSubmissions = await Submission.find({
          examId: { $in: exams.map(exam => exam._id) }
        })
          .populate('examId')
          .populate('studentId', 'username firstName lastName')
          .sort({ submittedAt: -1 })
          .limit(5);
  
        const activeExams = await Exam.find({
          createdBy: user._id,
          status: 'PUBLISHED',
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() }
        }).limit(5);

        // Get submission counts for active exams
        const submissionCounts = await Submission.aggregate([
          {
            $match: {
              examId: { $in: activeExams.map(exam => exam._id) }
            }
          },
          {
            $group: {
              _id: '$examId',
              submissionCount: { $sum: 1 }
            }
          }
        ]);

        // Create a map of exam ID to submission count
        const submissionCountMap = submissionCounts.reduce((acc, curr) => {
          acc[curr._id.toString()] = curr.submissionCount;
          return acc;
        }, {});

        // Add submission count to each active exam
        activeExams.forEach(exam => {
          exam.submissionCount = submissionCountMap[exam._id.toString()] || 0;
        });
  
        res.render('dashboard', {
          title: 'Dashboard',
          user,
          stats,
          recentSubmissions,
          activeExams
        });
      } else if (user.role === 'admin') {
        // ... admin code remains unchanged ...
        stats.totalExams = await Exam.countDocuments();
        const results = await Result.find();
        
        if (results.length > 0) {
          const totalPercentage = results.reduce((sum, result) => sum + result.percentage, 0);
          stats.averageScore = (totalPercentage / results.length).toFixed(2);
          stats.examsPassed = results.filter(result => result.status === 'PASS').length;
          stats.examsFailed = results.filter(result => result.status === 'FAIL').length;
        }
  
        const recentActivity = await Submission.find()
          .populate('examId')
          .populate('studentId', 'username firstName lastName')
          .sort({ submittedAt: -1 })
          .limit(10);
  
        res.render('dashboard', {
          title: 'Dashboard',
          user,
          stats,
          recentActivity
        });
      }
    } catch (error) {
      console.error('Error in getDashboard:', error);
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
        }).populate('createdBy', 'name')
          .populate({ 
                path: 'createdBy', 
                select: 'firstName lastName' 
        });

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