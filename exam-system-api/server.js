const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const path = require('path');
const connectDB = require('./src/config/database');
const errorHandler = require('./src/middleware/error');

// Load env vars
dotenv.config({ path: '.env' });

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
}));

// Set security headers
app.use(helmet());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// File upload
app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: process.env.MAX_FILE_UPLOAD || 1024 * 1024 * 5 // 5MB default
    },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: process.env.NODE_ENV === 'development'
}));

// Set static folder for uploads
const uploadPath = process.env.FILE_UPLOAD_PATH || './public/uploads';
app.use('/uploads', express.static(path.join(__dirname, uploadPath)));

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// API Routes
const authRoutes = require('./src/routes/authRoutes');
const examRoutes = require('./src/routes/examRoutes');
const questionRoutes = require('./src/routes/questionRoutes');
const submissionRoutes = require('./src/routes/submissionRoutes');
const resultRoutes = require('./src/routes/resultRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/results', resultRoutes);

// Base route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Examination System API',
        version: '1.0.0'
    });
});

// Handle undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    // Close server & exit process
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

