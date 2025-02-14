const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const methodOverride = require('method-override');
const fileUpload = require('express-fileupload');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_system_mvc')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Layout setup
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Add these lines for layout configuration
app.set('layout extractMetas', true);
app.locals.defineContent = function(name) {
    return `<%- defineContent('${name}') %>`;
};
app.locals.body = '<%- body %>';

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(fileUpload());
app.use(morgan('dev'));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_system_mvc',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Flash messages middleware
app.use(flash());

// CSRF protection
app.use(csrf({ cookie: true }));

// Pass data to all views
app.use((req, res, next) => {
  // Only set CSRF token if the route is not excluded
  if (!req.path.startsWith('/auth/logout')) {
    res.locals.csrfToken = req.csrfToken();
  }
  
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  
  // Get flash messages
  const success = req.flash('success');
  const error = req.flash('error');
  const info = req.flash('info');
  
  // Only set messages if they exist
  res.locals.messages = {
    success: success.length > 0 ? success : null,
    error: error.length > 0 ? error : null,
    info: info.length > 0 ? info : null
  };
  
  next();
});

// Routes
const authRoutes = require('./src/routes/authRoutes');
const examRoutes = require('./src/routes/examRoutes');
const questionRoutes = require('./src/routes/questionRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/exams', examRoutes);
app.use('/questions', questionRoutes);
app.use('/', adminRoutes);

const errorHandler = require('./src/middleware/errorHandler');

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 Not Found',
    msg: 'The page you are looking for does not exist.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 