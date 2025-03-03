/**
 * Ticket routes for the Queue Ticket Service
 * 
 * This file defines all routes related to ticket generation and management:
 * - Getting a new ticket for a specific queue
 * - Resetting a queue's counter
 * - Getting the current ticket number without incrementing
 * - Getting statistics for a queue
 * 
 * All routes include proper validation and error handling.
 */

const express = require('express');
const Joi = require('joi');
const TicketController = require('../controllers/TicketController');
const validationMiddleware = require('../middleware/validationMiddleware');

/**
 * Creates and configures the ticket routes
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.queueService - QueueService instance
 * @param {Object} options.logger - Logger instance
 * @returns {express.Router} Configured Express router for ticket operations
 */
function createTicketRoutes(options = {}) {
  const { queueService, logger } = options;
  const router = express.Router();
  const ticketController = new TicketController({ queueService, logger });

  // Validation schemas
  const queueIdSchema = Joi.object({
    queueId: Joi.string().trim().required().min(1).max(50)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .messages({
        'string.empty': 'Queue ID cannot be empty',
        'string.min': 'Queue ID must be at least 1 character long',
        'string.max': 'Queue ID cannot exceed 50 characters',
        'string.pattern.base': 'Queue ID can only contain alphanumeric characters, underscores, and hyphens',
        'any.required': 'Queue ID is required'
      })
  });

  const resetSchema = Joi.object({
    value: Joi.number().integer().min(0).max(9999).default(0)
      .messages({
        'number.base': 'Reset value must be a number',
        'number.integer': 'Reset value must be an integer',
        'number.min': 'Reset value cannot be negative',
        'number.max': 'Reset value cannot exceed 9999'
      })
  });

  /**
   * @route GET /api/v1/tickets/:queueId
   * @description Get next ticket number for a specific queue
   * @param {string} queueId - ID of the queue
   * @returns {Object} Ticket information including queue ID and ticket number
   */
  router.get(
    '/:queueId',
    validationMiddleware({ params: queueIdSchema }),
    ticketController.getNextTicket
  );

  /**
   * @route GET /api/v1/tickets/:queueId/current
   * @description Get current ticket number without incrementing
   * @param {string} queueId - ID of the queue
   * @returns {Object} Current ticket information
   */
  router.get(
    '/:queueId/current',
    validationMiddleware({ params: queueIdSchema }),
    ticketController.getCurrentTicket
  );

  /**
   * @route POST /api/v1/tickets/:queueId/reset
   * @description Reset ticket counter for a specific queue
   * @param {string} queueId - ID of the queue
   * @param {number} [value=0] - Optional value to reset the counter to (defaults to 0)
   * @returns {Object} Confirmation of reset operation
   */
  router.post(
    '/:queueId/reset',
    validationMiddleware({ 
      params: queueIdSchema,
      body: resetSchema
    }),
    ticketController.resetQueueCounter
  );

  /**
   * @route GET /api/v1/tickets/:queueId/stats
   * @description Get statistics for a specific queue
   * @param {string} queueId - ID of the queue
   * @returns {Object} Queue statistics
   */
  router.get(
    '/:queueId/stats',
    validationMiddleware({ params: queueIdSchema }),
    ticketController.getQueueStats
  );

  /**
   * @route GET /api/v1/tickets
   * @description Get list of all active queues
   * @returns {Object} List of all queues and their current status
   */
  router.get(
    '/',
    ticketController.getAllQueues
  );

  /**
   * @route DELETE /api/v1/tickets/:queueId
   * @description Delete a queue and all its data
   * @param {string} queueId - ID of the queue to delete
   * @returns {Object} Confirmation of deletion
   */
  router.delete(
    '/:queueId',
    validationMiddleware({ params: queueIdSchema }),
    ticketController.deleteQueue
  );

  /**
   * @route POST /api/v1/tickets/batch
   * @description Create multiple tickets at once for different queues
   * @param {Array} queueIds - Array of queue IDs to generate tickets for
   * @returns {Object} Generated tickets for each queue
   */
  router.post(
    '/batch',
    validationMiddleware({
      body: Joi.object({
        queueIds: Joi.array().items(Joi.string().trim().min(1).max(50)
          .pattern(/^[a-zA-Z0-9_-]+$/))
          .min(1)
          .required()
          .messages({
            'array.min': 'At least one queue ID is required',
            'any.required': 'Queue IDs array is required'
          })
      })
    }),
    ticketController.getBatchTickets
  );

  return router;
}

module.exports = createTicketRoutes;