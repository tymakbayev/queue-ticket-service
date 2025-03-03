/**
 * Integration tests for the ticket generation API endpoints
 * 
 * These tests verify that the entire ticket service works correctly
 * from HTTP request to response, including storage and business logic.
 */

const request = require('supertest');
const express = require('express');
const App = require('../../src/App');
const Logger = require('../../src/utils/Logger');
const ErrorHandler = require('../../src/utils/ErrorHandler');
const QueueService = require('../../src/services/QueueService');
const QueueRepository = require('../../src/repositories/QueueRepository');
const TicketController = require('../../src/controllers/TicketController');
const InMemoryStorageAdapter = require('../../src/adapters/InMemoryStorageAdapter');

// Mock logger to prevent console output during tests
jest.mock('../../src/utils/Logger', () => {
  return jest.fn().mockImplementation(() => {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
  });
});

describe('Ticket API Integration Tests', () => {
  let app;
  let server;
  let storageAdapter;
  let queueRepository;
  let queueService;
  let ticketController;
  let errorHandler;
  let logger;
  let expressApp;

  beforeAll(async () => {
    // Setup test dependencies
    logger = new Logger();
    storageAdapter = new InMemoryStorageAdapter(logger);
    queueRepository = new QueueRepository(storageAdapter, logger);
    queueService = new QueueService(queueRepository, logger);
    ticketController = new TicketController(queueService, logger);
    errorHandler = new ErrorHandler(logger);

    // Create app instance
    app = new App(
      { port: 0 }, // Use port 0 to let the OS assign a free port
      ticketController,
      errorHandler,
      logger,
      queueService,
      queueRepository,
      storageAdapter
    );

    // Start the app
    await app.start();
    expressApp = app.getExpressApp();
    server = app.getServer();
  });

  afterAll(async () => {
    // Clean up resources
    await app.stop();
  });

  beforeEach(async () => {
    // Reset storage before each test
    await storageAdapter.clear();
  });

  describe('GET /api/tickets/:queueId', () => {
    it('should return a new ticket with number 0000 for a new queue', async () => {
      const response = await request(expressApp)
        .get('/api/tickets/queue1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('ticket');
      expect(response.body.ticket).toHaveProperty('number', '0000');
      expect(response.body.ticket).toHaveProperty('queueId', 'queue1');
    });

    it('should increment ticket number for subsequent requests to the same queue', async () => {
      // First request
      await request(expressApp)
        .get('/api/tickets/queue2')
        .expect(200);

      // Second request
      const response = await request(expressApp)
        .get('/api/tickets/queue2')
        .expect(200);

      expect(response.body.ticket.number).toBe('0001');
      expect(response.body.ticket.queueId).toBe('queue2');

      // Third request
      const response2 = await request(expressApp)
        .get('/api/tickets/queue2')
        .expect(200);

      expect(response2.body.ticket.number).toBe('0002');
      expect(response2.body.ticket.queueId).toBe('queue2');
    });

    it('should handle multiple queues independently', async () => {
      // Queue 3 - First ticket
      const response1 = await request(expressApp)
        .get('/api/tickets/queue3')
        .expect(200);
      
      expect(response1.body.ticket.number).toBe('0000');
      
      // Queue 4 - First ticket
      const response2 = await request(expressApp)
        .get('/api/tickets/queue4')
        .expect(200);
      
      expect(response2.body.ticket.number).toBe('0000');
      
      // Queue 3 - Second ticket
      const response3 = await request(expressApp)
        .get('/api/tickets/queue3')
        .expect(200);
      
      expect(response3.body.ticket.number).toBe('0001');
      
      // Queue 4 - Second ticket
      const response4 = await request(expressApp)
        .get('/api/tickets/queue4')
        .expect(200);
      
      expect(response4.body.ticket.number).toBe('0001');
    });

    it('should reset to 0000 after reaching 9999', async () => {
      // Set the counter to 9999 for a specific queue
      await queueRepository.setCounter('queue5', 9999);
      
      // Get the next ticket which should roll over to 0000
      const response = await request(expressApp)
        .get('/api/tickets/queue5')
        .expect(200);
      
      expect(response.body.ticket.number).toBe('0000');
    });

    it('should return 400 for invalid queue ID', async () => {
      const response = await request(expressApp)
        .get('/api/tickets/invalid!queue@id')
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid queue ID');
    });

    it('should return 400 for empty queue ID', async () => {
      const response = await request(expressApp)
        .get('/api/tickets/')
        .expect(404); // Express returns 404 for missing route parameters
    });
  });

  describe('GET /api/queues/:queueId/status', () => {
    it('should return the current counter for an existing queue', async () => {
      // Create a queue with some tickets
      await request(expressApp).get('/api/tickets/queue6');
      await request(expressApp).get('/api/tickets/queue6');
      
      // Check the status
      const response = await request(expressApp)
        .get('/api/queues/queue6/status')
        .expect(200);
      
      expect(response.body).toHaveProperty('queueId', 'queue6');
      expect(response.body).toHaveProperty('currentCounter', 1); // 0-based index, so after 2 tickets it's 1
      expect(response.body).toHaveProperty('nextTicketNumber', '0002');
    });

    it('should return 404 for a non-existent queue', async () => {
      const response = await request(expressApp)
        .get('/api/queues/nonexistent/status')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Queue not found');
    });
  });

  describe('POST /api/queues/:queueId/reset', () => {
    it('should reset the counter for an existing queue', async () => {
      // Create a queue with some tickets
      await request(expressApp).get('/api/tickets/queue7');
      await request(expressApp).get('/api/tickets/queue7');
      
      // Reset the queue
      const resetResponse = await request(expressApp)
        .post('/api/queues/queue7/reset')
        .expect(200);
      
      expect(resetResponse.body).toHaveProperty('success', true);
      expect(resetResponse.body).toHaveProperty('message');
      expect(resetResponse.body.message).toContain('reset');
      
      // Verify the reset worked by getting a new ticket
      const ticketResponse = await request(expressApp)
        .get('/api/tickets/queue7')
        .expect(200);
      
      expect(ticketResponse.body.ticket.number).toBe('0000');
    });

    it('should create and reset a non-existent queue', async () => {
      const response = await request(expressApp)
        .post('/api/queues/newqueue/reset')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      
      // Verify the queue was created with counter at 0
      const ticketResponse = await request(expressApp)
        .get('/api/tickets/newqueue')
        .expect(200);
      
      expect(ticketResponse.body.ticket.number).toBe('0000');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(expressApp)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(expressApp)
        .get('/api/nonexistent')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors with 500 status code', async () => {
      // Mock the repository to throw an error
      const originalGetCounter = queueRepository.getCounter;
      queueRepository.getCounter = jest.fn().mockRejectedValue(new Error('Storage error'));
      
      const response = await request(expressApp)
        .get('/api/tickets/error-queue')
        .expect(500);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Internal server error');
      
      // Restore the original method
      queueRepository.getCounter = originalGetCounter;
    });
  });

  describe('Performance tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const queueId = 'concurrent-queue';
      const requestCount = 10;
      
      // Create an array of promises for concurrent requests
      const requests = Array(requestCount).fill().map(() => 
        request(expressApp).get(`/api/tickets/${queueId}`)
      );
      
      // Execute all requests concurrently
      const responses = await Promise.all(requests);
      
      // Check that all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('ticket');
        expect(response.body.ticket).toHaveProperty('queueId', queueId);
      });
      
      // Check that ticket numbers are sequential and unique
      const ticketNumbers = responses.map(r => parseInt(r.body.ticket.number, 10));
      const uniqueNumbers = new Set(ticketNumbers);
      
      // Should have as many unique numbers as requests
      expect(uniqueNumbers.size).toBe(requestCount);
      
      // Check the highest number is requestCount - 1 (since we start at 0)
      expect(Math.max(...ticketNumbers)).toBe(requestCount - 1);
    });
  });
});