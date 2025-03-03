/**
 * Validation middleware for the Queue Ticket Service
 * 
 * This middleware provides request validation using Joi schemas.
 * It validates request parameters, query strings, and request bodies
 * against predefined schemas to ensure data integrity before processing.
 * 
 * The middleware can be applied to specific routes or globally.
 * When validation fails, it throws a ValidationError that will be
 * caught and formatted by the errorMiddleware.
 */

const Joi = require('joi');
const { BadRequestError } = require('./errorMiddleware');

/**
 * Schema definitions for various API endpoints
 */
const schemas = {
  // Schema for ticket generation endpoint
  generateTicket: Joi.object({
    queueId: Joi.string().trim().required().description('Queue identifier')
  }),

  // Schema for retrieving queue status
  getQueueStatus: Joi.object({
    queueId: Joi.string().trim().required().description('Queue identifier')
  }),

  // Schema for resetting a queue counter
  resetQueue: Joi.object({
    queueId: Joi.string().trim().required().description('Queue identifier'),
    resetValue: Joi.number().integer().min(0).max(9999).default(0)
      .description('Value to reset the counter to (defaults to 0)')
  }),

  // Schema for creating a new queue
  createQueue: Joi.object({
    queueId: Joi.string().trim().required().description('Queue identifier'),
    description: Joi.string().trim().max(200).description('Queue description'),
    initialValue: Joi.number().integer().min(0).max(9999).default(0)
      .description('Initial counter value (defaults to 0)')
  }),

  // Schema for bulk operations
  bulkOperation: Joi.object({
    queues: Joi.array().items(Joi.string().trim()).min(1).required()
      .description('Array of queue identifiers'),
    operation: Joi.string().valid('reset', 'delete').required()
      .description('Operation to perform on the queues')
  })
};

/**
 * Creates a validation middleware for a specific request part
 * 
 * @param {Object} schema - Joi schema to validate against
 * @param {String} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const dataToValidate = req[property];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: {
          label: false
        }
      }
    });

    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      throw new BadRequestError(`Validation error: ${message}`);
    }

    // Replace the validated data
    req[property] = value;
    next();
  };
}

/**
 * Middleware to validate queue ID parameter
 * Used for routes that accept queueId as a URL parameter
 */
function validateQueueIdParam(req, res, next) {
  const queueIdSchema = Joi.string().trim().required();
  
  const { error } = queueIdSchema.validate(req.params.queueId);
  
  if (error) {
    throw new BadRequestError(`Invalid queue ID: ${error.message}`);
  }
  
  next();
}

/**
 * Middleware to validate pagination parameters
 * Used for routes that support pagination
 */
function validatePagination(req, res, next) {
  const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  });
  
  const { error, value } = paginationSchema.validate(req.query, {
    stripUnknown: true
  });
  
  if (error) {
    throw new BadRequestError(`Invalid pagination parameters: ${error.message}`);
  }
  
  // Add validated pagination parameters to request
  req.pagination = value;
  next();
}

/**
 * Middleware to validate date range parameters
 * Used for routes that filter by date range
 */
function validateDateRange(req, res, next) {
  const dateRangeSchema = Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }).and('startDate', 'endDate');
  
  const { error, value } = dateRangeSchema.validate(req.query, {
    stripUnknown: false
  });
  
  if (error) {
    throw new BadRequestError(`Invalid date range: ${error.message}`);
  }
  
  // If date range is provided, add it to request
  if (value.startDate && value.endDate) {
    req.dateRange = {
      startDate: value.startDate,
      endDate: value.endDate
    };
  }
  
  next();
}

/**
 * Middleware to validate and sanitize search query
 * Used for routes that support searching
 */
function validateSearchQuery(req, res, next) {
  const searchSchema = Joi.object({
    q: Joi.string().trim().min(1).max(100)
  });
  
  const { error, value } = searchSchema.validate(req.query, {
    stripUnknown: false
  });
  
  if (error) {
    throw new BadRequestError(`Invalid search query: ${error.message}`);
  }
  
  // If search query is provided, add it to request
  if (value.q) {
    req.searchQuery = value.q;
  }
  
  next();
}

module.exports = {
  validateRequest,
  validateQueueIdParam,
  validatePagination,
  validateDateRange,
  validateSearchQuery,
  schemas
};