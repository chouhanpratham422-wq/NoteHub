import multer from 'multer';

// 404 Handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size must be less than 10 MB';
    } else {
      message = `Upload error: ${err.message}`;
    }
  } else if (err.message === 'File must be a PDF') {
    statusCode = 400;
    message = 'File must be a PDF';
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found with specified identifier';
  }

  // Handle Mongoose Duplicate Key Error (e.g. email, subject code)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    if (field === 'email') {
      message = 'An account with this email address already exists.';
    } else if (field === 'code') {
      message = `Subject code '${value}' is already registered.`;
    } else if (field === 'note' && err.keyPattern?.user) {
      message = 'You have already reviewed this note. You can edit your existing review.';
    } else {
      message = `Duplicate field value: ${field}. Please use another value.`;
    }
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((val) => val.message);
    message = messages.join('. ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
