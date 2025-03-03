/**
 * Logger middleware for the Queue Ticket Service
 * 
 * This middleware provides request logging functionality using Winston.
 * It logs incoming requests, outgoing responses, and attaches a logger
 * instance to the request object for use in route handlers.
 * 
 * Features:
 * - Generates unique request IDs for request tracing
 * - Logs request details (method, path, query params, headers)
 * - Logs response details (status code, response time)
 * - Provides different log levels based on response status
 * - Attaches a child logger to each request for contextual logging
 */

const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'queue-ticket-service' },
  transports: [
    // Write logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// If we're not in production, also log to the console with colorized output
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * Sanitizes headers to remove sensitive information before logging
 * 
 * @param {Object} headers - Request headers
 * @returns {Object} Sanitized headers
 */
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  
  // List of sensitive headers to mask
  const sensitiveHeaders = [
    'authorization',
    'x-api-key',
    'cookie',
    'set-cookie',
    'x-auth-token'
  ];
  
  // Mask sensitive headers
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Determines the appropriate log level based on response status code
 * 
 * @param {Number} statusCode - HTTP status code
 * @returns {String} Winston log level
 */
function getLogLevelForStatus(statusCode) {
  if (statusCode >= 500) {
    return 'error';
  } else if (statusCode >= 400) {
    return 'warn';
  } else {
    return 'info';
  }
}

/**
 * Main logger middleware function
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function loggerMiddleware(req, res, next) {
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;
  
  // Record request start time
  const startTime = Date.now();
  
  // Create child logger with request context
  const requestLogger = logger.child({
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress
  });
  
  // Attach logger to request object for use in route handlers
  req.logger = requestLogger;
  
  // Log incoming request
  requestLogger.info('Request received', {
    query: req.query,
    params: req.params,
    headers: sanitizeHeaders(req.headers),
    body: req.method !== 'GET' ? req.body : undefined
  });
  
  // Capture response data
  const originalSend = res.send;
  res.send = function(body) {
    res.responseBody = body;
    return originalSend.apply(res, arguments);
  };
  
  // Log response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const logLevel = getLogLevelForStatus(res.statusCode);
    
    let responseBody;
    try {
      // Only parse and log response body if it's JSON and not too large
      if (res.responseBody && 
          res.get('Content-Type')?.includes('application/json') && 
          typeof res.responseBody === 'string' && 
          res.responseBody.length < 10000) {
        responseBody = JSON.parse(res.responseBody);
        
        // If response contains error details, include them in the log
        if (responseBody.error) {
          responseBody = { error: responseBody.error };
        } else {
          // For successful responses, just log that a response was sent
          responseBody = { message: 'Response body omitted' };
        }
      }
    } catch (err) {
      // If we can't parse the response body, just omit it
      responseBody = { message: 'Response body could not be parsed' };
    }
    
    requestLogger[logLevel]('Request completed', {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      responseHeaders: sanitizeHeaders(res.getHeaders()),
      responseBody
    });
  });
  
  // Log errors
  res.on('error', (err) => {
    requestLogger.error('Response error', {
      error: err.message,
      stack: err.stack
    });
  });
  
  next();
}

/**
 * Middleware to log unhandled errors
 * This should be registered after all routes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function logUnhandledErrors(err, req, res, next) {
  const requestLogger = req.logger || logger;
  
  requestLogger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId
  });
  
  next(err);
}

module.exports = {
  logger,
  loggerMiddleware,
  logUnhandledErrors
};