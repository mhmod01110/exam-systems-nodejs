const AppError = require('../utils/AppError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.keyValue ? Object.values(err.keyValue)[0] : '';
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  console.error('ERROR 💥', err);
  
  if (req.xhr || req.headers.accept.includes('json')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  res.status(err.statusCode).render('error', {
    title: 'Error',
    msg: err.message,
    error: err
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.xhr || req.headers.accept.includes('json')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Error',
      msg: err.message
    });
  }
  
  return res.status(500).render('error', {
    title: 'Error',
    msg: 'Please try again later.'
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (err.code === 'EBADCSRFTOKEN') error = new AppError('Invalid form submission. Please try again.', 403);

    sendErrorProd(error, req, res);
  }
}; 