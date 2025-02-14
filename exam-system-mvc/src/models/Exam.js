const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Exam title is required"],
        trim: true,
        minlength: [3, "Title must be at least 3 characters"],
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    type: {
        type: String,
        enum: {
            values: ['MCQ', 'PROJECT', 'MIXED'],
            message: "{VALUE} is not a valid exam type"
        },
        required: [true, "Exam type is required"]
    },
    duration: {
        type: Number, // in minutes
        required: [true, "Exam duration is required"],
        min: [5, "Duration must be at least 5 minutes"],
        max: [480, "Duration cannot exceed 8 hours"]
    },
    startDate: {
        type: Date,
        required: [true, "Start date is required"]
    },
    endDate: {
        type: Date,
        required: [true, "End date is required"]
    },
    totalMarks: {
        type: Number,
        required: [true, "Total marks is required"],
        min: [1, "Total marks must be at least 1"]
    },
    passingMarks: {
        type: Number,
        required: [true, "Passing marks is required"],
        min: [1, "Passing marks must be at least 1"],
        validate: {
            validator: function(value) {
                return value <= this.totalMarks;
            },
            message: "Passing marks cannot be greater than total marks"
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Creator is required"]
    },
    department: {
        type: String,
        required: [true, "Department is required"],
        trim: true
    },
    status: {
        type: String,
        enum: {
            values: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'],
            message: "{VALUE} is not a valid status"
        },
        default: 'DRAFT'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    allowedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    shuffleQuestions: {
        type: Boolean,
        default: true
    },
    showResults: {
        type: Boolean,
        default: true
    },
    resultReleaseDate: {
        type: Date
    },
    instructions: {
        type: String,
        trim: true
    },
    maxAttempts: {
        type: Number,
        default: 1,
        min: [1, "Maximum attempts must be at least 1"]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for number of enrolled students
examSchema.virtual('enrolledCount').get(function() {
    return this.allowedStudents.length;
});

// Ensure end date is after start date
examSchema.pre('save', function(next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    }
    next();
});

// Index for better query performance
examSchema.index({ startDate: 1, endDate: 1 });
examSchema.index({ status: 1 });
examSchema.index({ department: 1 });

module.exports = mongoose.model('Exam', examSchema); 