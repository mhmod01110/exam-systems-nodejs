// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');

// Protect routes
exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new ErrorResponse('Not authorized to access this route', 401));
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return next(new ErrorResponse('User not found', 404));
            }

            if (!req.user.isActive) {
                return next(new ErrorResponse('User account is deactivated', 401));
            }

            next();
        } catch (err) {
            return next(new ErrorResponse('Not authorized to access this route', 401));
        }
    } catch (error) {
        next(error);
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403));
        }
        next();
    };
};

// Track user activity
exports.trackActivity = async (req, res, next) => {
    try {
        if (req.user) {
            req.user.lastLogin = new Date();
            await req.user.save({ validateBeforeSave: false });
        }
        next();
    } catch (error) {
        next(error);
    }
};

// module.exports = { protect, authorize, trackActivity };