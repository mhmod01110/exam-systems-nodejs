const mongoose = require("mongoose");

const mcqAnswerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: [true, "Question ID is required"]
    },
    selectedOption: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Selected option is required"]
    },
    isCorrect: {
        type: Boolean,
        default: false
    },
    marksObtained: {
        type: Number,
        default: 0
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0
    }
});

const projectSubmissionSchema = new mongoose.Schema({
    fileUrl: {
        type: String,
        required: [true, "File URL is required"]
    },
    fileName: {
        type: String,
        required: [true, "File name is required"]
    },
    fileSize: {
        type: Number, // in bytes
        required: [true, "File size is required"]
    },
    fileType: {
        type: String,
        required: [true, "File type is required"]
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    feedback: {
        text: String,
        givenAt: Date,
        givenBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    marksObtained: {
        type: Number,
        min: [0, "Marks cannot be negative"]
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    evaluationNotes: [{
        note: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    plagiarismScore: {
        type: Number,
        min: 0,
        max: 100
    }
});

const submissionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: [true, "Exam ID is required"],
        index: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Student ID is required"],
        index: true
    },
    submissionType: {
        type: String,
        enum: {
            values: ['MCQ', 'PROJECT'],
            message: "{VALUE} is not a valid submission type"
        },
        required: [true, "Submission type is required"]
    },
    attemptNumber: {
        type: Number,
        required: [true, "Attempt number is required"],
        min: [1, "Attempt number must be at least 1"]
    },
    // For MCQ submissions
    answers: [mcqAnswerSchema],
    // For Project submissions
    projectSubmission: projectSubmissionSchema,
    status: {
        type: String,
        enum: {
            values: ['DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'EVALUATED', 'REJECTED'],
            message: "{VALUE} is not a valid status"
        },
        default: 'DRAFT'
    },
    totalMarksObtained: {
        type: Number,
        default: 0,
        min: [0, "Total marks cannot be negative"]
    },
    submittedAt: {
        type: Date
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0
    },
    ipAddress: {
        type: String
    },
    browserInfo: {
        type: String
    },
    isLate: {
        type: Boolean,
        default: false
    },
    lateSubmissionReason: {
        type: String
    },
    flags: {
        suspiciousActivity: {
            type: Boolean,
            default: false
        },
        tabSwitches: {
            type: Number,
            default: 0
        },
        technicalIssues: [{
            issue: String,
            timestamp: Date
        }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
submissionSchema.index({ examId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });
submissionSchema.index({ status: 1 });
submissionSchema.index({ submittedAt: 1 });

// Virtual for submission duration
submissionSchema.virtual('duration').get(function() {
    if (this.completedAt && this.startedAt) {
        return Math.round((this.completedAt - this.startedAt) / 1000); // in seconds
    }
    return 0;
});

// Pre-save middleware
submissionSchema.pre('save', function(next) {
    // Calculate total marks for MCQ submissions
    if (this.submissionType === 'MCQ' && this.answers && this.answers.length > 0) {
        this.totalMarksObtained = this.answers.reduce((total, answer) => total + answer.marksObtained, 0);
    }
    
    // Set completion time if status changes to SUBMITTED
    if (this.isModified('status') && this.status === 'SUBMITTED') {
        this.completedAt = new Date();
        this.timeSpent = Math.round((this.completedAt - this.startedAt) / 1000);
    }

    next();
});

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;

