const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, "Option text is required"],
        trim: true
    },
    isCorrect: {
        type: Boolean,
        default: false
    },
    explanation: {
        type: String,
        trim: true
    }
}, { _id: true });

const questionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: [true, "Exam ID is required"],
        index: true
    },
    questionText: {
        type: String,
        required: [true, "Question text is required"],
        trim: true,
        minlength: [3, "Question text must be at least 3 characters"]
    },
    type: {
        type: String,
        enum: {
            values: ['MCQ', 'PROJECT'],
            message: "{VALUE} is not a valid question type"
        },
        required: [true, "Question type is required"]
    },
    marks: {
        type: Number,
        required: [true, "Marks are required"],
        min: [0, "Marks cannot be negative"],
        validate: {
            validator: Number.isInteger,
            message: "Marks must be a whole number"
        }
    },
    difficulty: {
        type: String,
        enum: {
            values: ['EASY', 'MEDIUM', 'HARD'],
            message: "{VALUE} is not a valid difficulty level"
        },
        required: [true, "Difficulty level is required"]
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        trim: true
    },
    // For MCQ questions
    options: {
        type: [optionSchema],
        validate: {
            validator: function(options) {
                if (this.type === 'MCQ') {
                    // Must have at least 2 options for MCQ
                    if (options.length < 2) return false;
                    // Must have exactly one correct answer
                    const correctCount = options.filter(opt => opt.isCorrect).length;
                    return correctCount === 1;
                }
                return true; // Not applicable for PROJECT type
            },
            message: "MCQ questions must have at least 2 options and exactly one correct answer"
        }
    },
    // For Project questions
    projectRequirements: {
        type: String,
        required: function() {
            return this.type === 'PROJECT';
        },
        trim: true
    },
    submissionFormat: {
        type: String,
        enum: {
            values: ['ZIP', 'PDF', 'DOC', 'OTHER'],
            message: "{VALUE} is not a valid submission format"
        },
        required: function() {
            return this.type === 'PROJECT';
        }
    },
    maxFileSize: {
        type: Number, // in MB
        min: [1, "File size must be at least 1MB"],
        max: [100, "File size cannot exceed 100MB"],
        default: 10
    },
    allowedFileExtensions: [{
        type: String,
        trim: true
    }],
    // Common fields
    explanation: {
        type: String,
        trim: true
    },
    hints: [{
        type: String,
        trim: true
    }],
    images: [{
        url: String,
        caption: String
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Creator is required"]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
questionSchema.index({ type: 1, difficulty: 1 });
questionSchema.index({ category: 1 });

// Pre-save middleware to validate based on question type
questionSchema.pre('save', function(next) {
    if (this.type === 'MCQ') {
        if (!this.options || this.options.length < 2) {
            next(new Error('MCQ questions must have at least 2 options'));
        }
    } else if (this.type === 'PROJECT') {
        if (!this.projectRequirements) {
            next(new Error('Project questions must have requirements'));
        }
        if (!this.submissionFormat) {
            next(new Error('Project questions must specify submission format'));
        }
    }
    next();
});

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
