const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

exports.getLogin = (req, res) => {
    res.render('auth/login', {
        title: 'Login',
        error: req.flash('error')
    });
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }
        
        // Set session
        req.session.user = user;
        req.session.isAuthenticated = true;
        
        // Generate JWT for API access
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'An error occurred during login');
        res.redirect('/auth/login');
    }
};

exports.getRegister = (req, res) => {
    res.render('auth/register', {
        title: 'Register',
        error: req.flash('error')
    });
};

exports.postRegister = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        
        // Check if passwords match
        if (password !== confirmPassword) {
            req.flash('error', 'Passwords do not match');
            return res.redirect('/auth/register');
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email already registered');
            return res.redirect('/auth/register');
        }
        
        // Create new user
        const user = new User({
            name,
            email,
            password
        });
        
        await user.save();
        
        req.flash('success', 'Registration successful. Please login.');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error', 'An error occurred during registration');
        res.redirect('/auth/register');
    }
};

exports.getForgotPassword = (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Forgot Password',
        error: req.flash('error'),
        success: req.flash('success')
    });
};

exports.postForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            req.flash('error', 'No account with that email address exists');
            return res.redirect('/auth/forgot-password');
        }
        
        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();
        
        // Send reset email
        const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${token}`;
        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset',
            html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="${resetUrl}">link</a> to set a new password.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });
        
        req.flash('success', 'Check your email for password reset instructions');
        res.redirect('/auth/forgot-password');
    } catch (error) {
        console.error('Forgot password error:', error);
        req.flash('error', 'An error occurred while processing your request');
        res.redirect('/auth/forgot-password');
    }
};

exports.getResetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired');
            return res.redirect('/auth/forgot-password');
        }
        
        res.render('auth/reset-password', {
            title: 'Reset Password',
            token: req.params.token,
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Reset password error:', error);
        req.flash('error', 'An error occurred while processing your request');
        res.redirect('/auth/forgot-password');
    }
};

exports.postResetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        
        if (password !== confirmPassword) {
            req.flash('error', 'Passwords do not match');
            return res.redirect('back');
        }
        
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired');
            return res.redirect('/auth/forgot-password');
        }
        
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        req.flash('success', 'Your password has been updated');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Reset password error:', error);
        req.flash('error', 'An error occurred while resetting your password');
        res.redirect('back');
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            // Handle error case
            return res.status(500).render('error', {
                title: 'Error',
                message: 'An error occurred during logout',
                csrfToken: req.csrfToken()
            });
        }
        // Clear the session cookie
        res.clearCookie('connect.sid');
        // Redirect to login page with new csrf token
        res.redirect('/auth/login');
    });
}; 