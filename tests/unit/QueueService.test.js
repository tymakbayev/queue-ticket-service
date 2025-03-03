/**
 * Unit tests for QueueService
 * 
 * These tests verify the functionality of the QueueService class, which is responsible
 * for managing ticket numbers for different queues. The service should:
 * - Generate sequential ticket numbers for each queue
 * - Format ticket numbers as 4-digit strings (e.g., "0001")
 * - Reset to "0000" after reaching "9999"
 * - Handle multiple queues independently
 */

const QueueService = require('../../src/services/QueueService');

// Mock dependencies
jest.mock('../../src/repositories/QueueRepository');
jest.mock('../../src/utils/Logger');

// Import mocked dependencies
const QueueRepository = require('../../src/repositories/QueueRepository');
const Logger = require('../../src/utils/Logger');

describe('QueueService', () => {
  // Setup variables
  let queueService;
  let mockRepository;
  let mockLogger;

  // Setup before each test
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockRepository = new QueueRepository();
    mockLogger = new Logger();

    // Setup mock implementations
    mockRepository.getNextTicketNumber = jest.fn();
    mockRepository.saveTicketNumber = jest.fn();
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();
    mockLogger.debug = jest.fn();

    // Create service instance with mocks
    queueService = new QueueService(mockRepository, mockLogger);
  });

  describe('getNextTicket', () => {
    it('should return a formatted ticket number for a new queue', async () => {
      // Setup
      const queueId = 'queue1';
      mockRepository.getNextTicketNumber.mockResolvedValue(null);
      mockRepository.saveTicketNumber.mockResolvedValue(true);

      // Execute
      const result = await queueService.getNextTicket(queueId);

      // Verify
      expect(result).toBe('0000');
      expect(mockRepository.getNextTicketNumber).toHaveBeenCalledWith(queueId);
      expect(mockRepository.saveTicketNumber).toHaveBeenCalledWith(queueId, 0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Issued ticket'),
        expect.objectContaining({ queueId, ticketNumber: '0000' })
      );
    });

    it('should return the next ticket number for an existing queue', async () => {
      // Setup
      const queueId = 'queue1';
      const currentNumber = 41;
      mockRepository.getNextTicketNumber.mockResolvedValue(currentNumber);
      mockRepository.saveTicketNumber.mockResolvedValue(true);

      // Execute
      const result = await queueService.getNextTicket(queueId);

      // Verify
      expect(result).toBe('0042');
      expect(mockRepository.getNextTicketNumber).toHaveBeenCalledWith(queueId);
      expect(mockRepository.saveTicketNumber).toHaveBeenCalledWith(queueId, 42);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Issued ticket'),
        expect.objectContaining({ queueId, ticketNumber: '0042' })
      );
    });

    it('should reset to 0000 after reaching 9999', async () => {
      // Setup
      const queueId = 'queue1';
      const currentNumber = 9999;
      mockRepository.getNextTicketNumber.mockResolvedValue(currentNumber);
      mockRepository.saveTicketNumber.mockResolvedValue(true);

      // Execute
      const result = await queueService.getNextTicket(queueId);

      // Verify
      expect(result).toBe('0000');
      expect(mockRepository.getNextTicketNumber).toHaveBeenCalledWith(queueId);
      expect(mockRepository.saveTicketNumber).toHaveBeenCalledWith(queueId, 0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Issued ticket'),
        expect.objectContaining({ queueId, ticketNumber: '0000' })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Reset ticket counter'),
        expect.objectContaining({ queueId })
      );
    });

    it('should handle multiple queues independently', async () => {
      // Setup
      const queue1 = 'queue1';
      const queue2 = 'queue2';
      
      mockRepository.getNextTicketNumber
        .mockResolvedValueOnce(5) // First call for queue1
        .mockResolvedValueOnce(10); // Second call for queue2
      
      mockRepository.saveTicketNumber.mockResolvedValue(true);

      // Execute
      const result1 = await queueService.getNextTicket(queue1);
      const result2 = await queueService.getNextTicket(queue2);

      // Verify
      expect(result1).toBe('0006');
      expect(result2).toBe('0011');
      
      expect(mockRepository.getNextTicketNumber).toHaveBeenCalledWith(queue1);
      expect(mockRepository.getNextTicketNumber).toHaveBeenCalledWith(queue2);
      
      expect(mockRepository.saveTicketNumber).toHaveBeenCalledWith(queue1, 6);
      expect(mockRepository.saveTicketNumber).toHaveBeenCalledWith(queue2, 11);
    });

    it('should throw an error if repository fails to get ticket number', async () => {
      // Setup
      const queueId = 'queue1';
      const error = new Error('Database connection failed');
      mockRepository.getNextTicketNumber.mockRejectedValue(error);

      // Execute & Verify
      await expect(queueService.getNextTicket(queueId)).rejects.toThrow('Failed to get next ticket number');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting next ticket'),
        expect.objectContaining({ 
          queueId,
          error: expect.any(Error)
        })
      );
    });

    it('should throw an error if repository fails to save ticket number', async () => {
      // Setup
      const queueId = 'queue1';
      mockRepository.getNextTicketNumber.mockResolvedValue(42);
      
      const error = new Error('Database write failed');
      mockRepository.saveTicketNumber.mockRejectedValue(error);

      // Execute & Verify
      await expect(queueService.getNextTicket(queueId)).rejects.toThrow('Failed to save ticket number');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error saving ticket'),
        expect.objectContaining({ 
          queueId,
          ticketNumber: 43,
          error: expect.any(Error)
        })
      );
    });

    it('should validate queueId parameter', async () => {
      // Test with invalid queue IDs
      await expect(queueService.getNextTicket('')).rejects.toThrow('Queue ID is required');
      await expect(queueService.getNextTicket(null)).rejects.toThrow('Queue ID is required');
      await expect(queueService.getNextTicket(undefined)).rejects.toThrow('Queue ID is required');
      
      // These should not throw
      mockRepository.getNextTicketNumber.mockResolvedValue(1);
      mockRepository.saveTicketNumber.mockResolvedValue(true);
      
      await expect(queueService.getNextTicket('valid-queue')).resolves.toBe('0002');
      await expect(queueService.getNextTicket('123')).resolves.toBe('0002');
    });
  });

  describe('getCurrentTicket', () => {
    it('should return the current ticket number for a queue', async () => {
      // Setup
      const queueId = 'queue1';
      mockRepository.getNextTicketNumber.mockResolvedValue(42);

      // Execute
      const result = await queueService.getCurrentTicket(queueId);

      // Verify
      expect(result).toBe('0042');
      expect(mockRepository.getNextTicketNumber).toHaveBeenCalledWith(queueId);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved current ticket'),
        expect.objectContaining({ queueId, ticketNumber: '0042' })
      );
    });

    it('should return 0000 for a new queue', async () => {
      // Setup
      const queueId = 'new-queue';
      mockRepository.getNextTicketNumber.mockResolvedValue(null);

      // Execute
      const result = await queueService.getCurrentTicket(queueId);

      // Verify
      expect(result).toBe('0000');
      expect(mockRepository.getNextTicketNumber).toHaveBeenCalledWith(queueId);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved current ticket'),
        expect.objectContaining({ queueId, ticketNumber: '0000' })
      );
    });

    it('should throw an error if repository fails', async () => {
      // Setup
      const queueId = 'queue1';
      const error = new Error('Database connection failed');
      mockRepository.getNextTicketNumber.mockRejectedValue(error);

      // Execute & Verify
      await expect(queueService.getCurrentTicket(queueId)).rejects.toThrow('Failed to get current ticket number');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting current ticket'),
        expect.objectContaining({ 
          queueId,
          error: expect.any(Error)
        })
      );
    });

    it('should validate queueId parameter', async () => {
      // Test with invalid queue IDs
      await expect(queueService.getCurrentTicket('')).rejects.toThrow('Queue ID is required');
      await expect(queueService.getCurrentTicket(null)).rejects.toThrow('Queue ID is required');
      await expect(queueService.getCurrentTicket(undefined)).rejects.toThrow('Queue ID is required');
    });
  });

  describe('resetQueue', () => {
    it('should reset the ticket number for a queue to 0', async () => {
      // Setup
      const queueId = 'queue1';
      mockRepository.saveTicketNumber.mockResolvedValue(true);

      // Execute
      await queueService.resetQueue(queueId);

      // Verify
      expect(mockRepository.saveTicketNumber).toHaveBeenCalledWith(queueId, 0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Reset queue'),
        expect.objectContaining({ queueId })
      );
    });

    it('should throw an error if repository fails', async () => {
      // Setup
      const queueId = 'queue1';
      const error = new Error('Database write failed');
      mockRepository.saveTicketNumber.mockRejectedValue(error);

      // Execute & Verify
      await expect(queueService.resetQueue(queueId)).rejects.toThrow('Failed to reset queue');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error resetting queue'),
        expect.objectContaining({ 
          queueId,
          error: expect.any(Error)
        })
      );
    });

    it('should validate queueId parameter', async () => {
      // Test with invalid queue IDs
      await expect(queueService.resetQueue('')).rejects.toThrow('Queue ID is required');
      await expect(queueService.resetQueue(null)).rejects.toThrow('Queue ID is required');
      await expect(queueService.resetQueue(undefined)).rejects.toThrow('Queue ID is required');
    });
  });

  describe('formatTicketNumber', () => {
    it('should format numbers as 4-digit strings with leading zeros', () => {
      // Test various numbers
      expect(queueService.formatTicketNumber(0)).toBe('0000');
      expect(queueService.formatTicketNumber(1)).toBe('0001');
      expect(queueService.formatTicketNumber(42)).toBe('0042');
      expect(queueService.formatTicketNumber(999)).toBe('0999');
      expect(queueService.formatTicketNumber(1000)).toBe('1000');
      expect(queueService.formatTicketNumber(9999)).toBe('9999');
    });

    it('should handle edge cases', () => {
      // Test with negative numbers (should be treated as 0)
      expect(queueService.formatTicketNumber(-1)).toBe('0000');
      
      // Test with numbers > 9999 (should be modulo 10000)
      expect(queueService.formatTicketNumber(10000)).toBe('0000');
      expect(queueService.formatTicketNumber(10001)).toBe('0001');
      expect(queueService.formatTicketNumber(20042)).toBe('0042');
    });
  });
});