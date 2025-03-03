/**
 * Entry point for the Queue Ticket Service
 * 
 * This file initializes all components of the application:
 * - Configuration
 * - Storage adapters (Redis or In-Memory)
 * - Repositories
 * - Services
 * - Controllers
 * - Error handling
 * - Logging
 * 
 * And starts the Express server to handle API requests.
 */

// Import required modules
const config = require('./config');
const App = require('./App');
const Logger = require('./utils/Logger');
const ErrorHandler = require('./utils/ErrorHandler');
const QueueService = require('./services/QueueService');
const QueueRepository = require('./repositories/QueueRepository');
const TicketController = require('./controllers/TicketController');
const RedisStorageAdapter = require('./adapters/RedisStorageAdapter');
const InMemoryStorageAdapter = require('./adapters/InMemoryStorageAdapter');

// Enable async error handling for Express
require('express-async-errors');

/**
 * Initialize and start the application
 */
async function bootstrap() {
  // Create logger instance
  const logger = new Logger();
  
  try {
    logger.info('Starting Queue Ticket Service...');
    
    // Get configuration
    const port = config.getPort();
    const storageType = config.getStorageType();
    const redisConfig = config.getRedisConfig();
    
    logger.info(`Using ${storageType} storage`);
    
    // Initialize the appropriate storage adapter
    let storageAdapter;
    if (storageType === 'redis') {
      storageAdapter = new RedisStorageAdapter(redisConfig, logger);
    } else {
      storageAdapter = new InMemoryStorageAdapter(logger);
    }
    
    // Initialize repositories, services and controllers
    const queueRepository = new QueueRepository(storageAdapter, logger);
    const queueService = new QueueService(queueRepository, logger);
    const errorHandler = new ErrorHandler(logger);
    const ticketController = new TicketController(queueService, logger);
    
    // Create and start the application
    const app = new App(
      { port },
      ticketController,
      errorHandler,
      logger,
      queueService,
      queueRepository,
      storageAdapter
    );
    
    await app.start();
    
    // Handle graceful shutdown
    setupGracefulShutdown(app, logger);
    
    logger.info(`Queue Ticket Service is running on port ${port}`);
  } catch (error) {
    logger.error('Failed to start the application:', error);
    process.exit(1);
  }
}

/**
 * Setup handlers for graceful shutdown
 * 
 * @param {App} app - The application instance
 * @param {Logger} logger - The logger instance
 */
function setupGracefulShutdown(app, logger) {
  // Handle process termination signals
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        await app.stop();
        logger.info('Application shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during application shutdown:', error);
        process.exit(1);
      }
    });
  });
  
  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    // For uncaught exceptions, we should exit after cleanup
    app.stop()
      .then(() => process.exit(1))
      .catch(() => process.exit(1));
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    // For unhandled rejections, we log but don't necessarily exit
  });
}

// Start the application
bootstrap();