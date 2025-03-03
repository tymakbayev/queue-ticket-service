/**
 * Main router configuration for the Queue Ticket Service
 * 
 * This file sets up all the routes for the application, including:
 * - API routes for ticket generation
 * - Health check endpoints
 * - API documentation routes
 * 
 * It also applies necessary middleware to the routes.
 */

const express = require('express');
const ticketRoutes = require('./ticketRoutes');
const validationMiddleware = require('../middleware/validationMiddleware');
const loggerMiddleware = require('../middleware/loggerMiddleware');

/**
 * Creates and configures the main router for the application
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.logger - Logger instance
 * @param {Object} options.queueService - QueueService instance for health checks
 * @returns {express.Router} Configured Express router
 */
function createRouter(options = {}) {
  const { logger, queueService } = options;
  const router = express.Router();

  // Apply common middleware to all routes
  router.use(loggerMiddleware(logger));

  // API routes
  router.use('/api/v1/tickets', ticketRoutes);

  // Health check endpoint
  router.get('/health', async (req, res) => {
    try {
      // Check if the queue service is operational
      const isHealthy = await queueService.isHealthy();
      
      if (isHealthy) {
        return res.status(200).json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'queue-ticket-service',
          uptime: process.uptime()
        });
      } else {
        return res.status(503).json({
          status: 'error',
          message: 'Service is not healthy',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Health check failed', error);
      return res.status(503).json({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // API documentation route
  router.get('/api-docs', (req, res) => {
    res.status(200).json({
      name: 'Queue Ticket Service API',
      version: '1.0.0',
      description: 'API for generating sequential ticket numbers for multiple queues',
      endpoints: [
        {
          path: '/api/v1/tickets/:queueId',
          method: 'GET',
          description: 'Get next ticket number for specified queue',
          parameters: [
            {
              name: 'queueId',
              in: 'path',
              required: true,
              description: 'ID of the queue to get a ticket for',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Successful operation',
              content: {
                'application/json': {
                  example: {
                    queueId: 'checkout',
                    ticketNumber: '0042',
                    timestamp: '2023-07-25T12:34:56.789Z'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid queue ID',
              content: {
                'application/json': {
                  example: {
                    error: 'Invalid queue ID format'
                  }
                }
              }
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  example: {
                    error: 'Internal server error'
                  }
                }
              }
            }
          }
        },
        {
          path: '/api/v1/tickets/:queueId/reset',
          method: 'POST',
          description: 'Reset ticket counter for specified queue',
          parameters: [
            {
              name: 'queueId',
              in: 'path',
              required: true,
              description: 'ID of the queue to reset',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Counter reset successfully',
              content: {
                'application/json': {
                  example: {
                    queueId: 'checkout',
                    message: 'Counter reset successfully',
                    timestamp: '2023-07-25T12:34:56.789Z'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid queue ID',
              content: {
                'application/json': {
                  example: {
                    error: 'Invalid queue ID format'
                  }
                }
              }
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  example: {
                    error: 'Internal server error'
                  }
                }
              }
            }
          }
        },
        {
          path: '/health',
          method: 'GET',
          description: 'Health check endpoint',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  example: {
                    status: 'ok',
                    timestamp: '2023-07-25T12:34:56.789Z',
                    service: 'queue-ticket-service',
                    uptime: 3600
                  }
                }
              }
            },
            '503': {
              description: 'Service is unhealthy',
              content: {
                'application/json': {
                  example: {
                    status: 'error',
                    message: 'Service is not healthy',
                    timestamp: '2023-07-25T12:34:56.789Z'
                  }
                }
              }
            }
          }
        }
      ]
    });
  });

  // Root route
  router.get('/', (req, res) => {
    res.status(200).json({
      service: 'Queue Ticket Service',
      version: '1.0.0',
      description: 'A microservice for generating sequential ticket numbers for multiple queues',
      links: {
        health: '/health',
        documentation: '/api-docs'
      }
    });
  });

  // 404 handler for undefined routes
  router.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.originalUrl} does not exist`,
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

module.exports = createRouter;