/**
 * Error handling middleware for the Queue Ticket Service
 *
 * This middleware catches all errors thrown during request processing
 * and formats them into a consistent response format.
 *
 * It handles different types of errors:
 * - Validation errors (from Joi)
 * - Custom application errors
 * - Database/storage errors
 * - Unexpected errors
 *
 * Each error type is mapped to an appropriate HTTP status code
 * and a standardized error response format.
 */

const ValidationError = require('joi');

/**
 * Custom error classes that may be thrown by the application
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * Main error handling middleware
 *
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function errorMiddleware(err, req, res, next) {
  // Get logger from request (attached in loggerMiddleware)
  const logger = req.logger || console;

  // Default error values
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  let errorDetails = null;
  let errorCode = 'INTERNAL_ERROR';

  // Handle Joi validation errors
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorMessage = 'Validation Error';
    errorDetails = err.details.map(detail => ({
      message: detail.message,
      path: detail.path,
      type: detail.type
    }));
    errorCode = 'VALIDATION_ERROR';

    logger.warn(`Validation error: ${err.message}`, {
      path: req.path,
      method: req.method,
      details: errorDetails
    });
  }
  // Handle custom application errors
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    errorCode = err.name.replace('Error', '').toUpperCase() + '_ERROR';

    logger.warn(`Application error: ${err.message}`, {
      path: req.path,
      method: req.method,
      statusCode,
      errorCode
    });
  }
  // Handle Redis or other storage errors
  else if (err.name === 'RedisError' || err.name === 'StorageError') {
    statusCode = 503;
    errorMessage = 'Storage Service Unavailable';
    errorCode = 'STORAGE_ERROR';

    logger.error(`Storage error: ${err.message}`, {
      path: req.path,
      method: req.method,
      error: err.stack
    });
  }
  // Handle unexpected errors
  else {
    logger.error(`Unexpected error: ${err.message}`, {
      path: req.path,
      method: req.method,
      error: err.stack
    });
  }

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      details: errorDetails,
      requestId: req.requestId // Set by loggerMiddleware
    }
  });
}

module.exports = {
  errorMiddleware,
  AppError,
  NotFoundError,
  BadRequestError,
  ConflictError
};
