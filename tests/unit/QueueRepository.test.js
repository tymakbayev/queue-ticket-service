/**
 * Unit tests for QueueRepository
 * 
 * These tests verify the functionality of the QueueRepository class, which is responsible
 * for storing and retrieving ticket numbers for different queues. The repository should:
 * - Store ticket numbers for each queue
 * - Retrieve the current ticket number for a queue
 * - Handle storage operations through a storage adapter
 * - Handle errors from the storage adapter
 */

const QueueRepository = require('../../src/repositories/QueueRepository');

// Mock dependencies
jest.mock('../../src/utils/Logger');
jest.mock('../../src/adapters/StorageAdapter', () => {
  return jest.fn().mockImplementation(() => {
    return {
      get: jest.fn(),
      set: jest.fn(),
      increment: jest.fn(),
      delete: jest.fn()
    };
  });
});

// Import mocked dependencies
const Logger = require('../../src/utils/Logger');
const StorageAdapter = require('../../src/adapters/StorageAdapter');

describe('QueueRepository', () => {
  // Setup variables
  let queueRepository;
  let mockStorageAdapter;
  let mockLogger;

  // Setup before each test
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockStorageAdapter = new StorageAdapter();
    mockLogger = new Logger();

    // Setup mock implementations
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();
    mockLogger.debug = jest.fn();

    // Create repository instance with mocks
    queueRepository = new QueueRepository(mockStorageAdapter, mockLogger);
  });

  describe('getNextTicketNumber', () => {
    it('should return the current ticket number for a queue', async () => {
      // Setup
      const queueId = 'queue1';
      const ticketNumber = 42;
      mockStorageAdapter.get.mockResolvedValue(ticketNumber);

      // Execute
      const result = await queueRepository.getNextTicketNumber(queueId);

      // Verify
      expect(result).toBe(ticketNumber);
      expect(mockStorageAdapter.get).toHaveBeenCalledWith(`queue:${queueId}`);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved ticket number'),
        expect.objectContaining({ queueId, ticketNumber })
      );
    });

    it('should return null if queue does not exist', async () => {
      // Setup
      const queueId = 'nonexistent';
      mockStorageAdapter.get.mockResolvedValue(null);

      // Execute
      const result = await queueRepository.getNextTicketNumber(queueId);

      // Verify
      expect(result).toBeNull();
      expect(mockStorageAdapter.get).toHaveBeenCalledWith(`queue:${queueId}`);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('No ticket number found'),
        expect.objectContaining({ queueId })
      );
    });

    it('should handle storage adapter errors', async () => {
      // Setup
      const queueId = 'queue1';
      const error = new Error('Storage error');
      mockStorageAdapter.get.mockRejectedValue(error);

      // Execute and verify
      await expect(queueRepository.getNextTicketNumber(queueId)).rejects.toThrow('Failed to retrieve ticket number');
      expect(mockStorageAdapter.get).toHaveBeenCalledWith(`queue:${queueId}`);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error retrieving ticket number'),
        expect.objectContaining({ 
          queueId,
          error: expect.any(Error)
        })
      );
    });
  });

  describe('saveTicketNumber', () => {
    it('should save the ticket number for a queue', async () => {
      // Setup
      const queueId = 'queue1';
      const ticketNumber = 42;
      mockStorageAdapter.set.mockResolvedValue(true);

      // Execute
      const result = await queueRepository.saveTicketNumber(queueId, ticketNumber);

      // Verify
      expect(result).toBe(true);
      expect(mockStorageAdapter.set).toHaveBeenCalledWith(`queue:${queueId}`, ticketNumber);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Saved ticket number'),
        expect.objectContaining({ queueId, ticketNumber })
      );
    });

    it('should handle storage adapter errors', async () => {
      // Setup
      const queueId = 'queue1';
      const ticketNumber = 42;
      const error = new Error('Storage error');
      mockStorageAdapter.set.mockRejectedValue(error);

      // Execute and verify
      await expect(queueRepository.saveTicketNumber(queueId, ticketNumber)).rejects.toThrow('Failed to save ticket number');
      expect(mockStorageAdapter.set).toHaveBeenCalledWith(`queue:${queueId}`, ticketNumber);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error saving ticket number'),
        expect.objectContaining({ 
          queueId,
          ticketNumber,
          error: expect.any(Error)
        })
      );
    });
  });

  describe('incrementTicketNumber', () => {
    it('should increment the ticket number for a queue', async () => {
      // Setup
      const queueId = 'queue1';
      const newTicketNumber = 43;
      mockStorageAdapter.increment.mockResolvedValue(newTicketNumber);

      // Execute
      const result = await queueRepository.incrementTicketNumber(queueId);

      // Verify
      expect(result).toBe(newTicketNumber);
      expect(mockStorageAdapter.increment).toHaveBeenCalledWith(`queue:${queueId}`);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Incremented ticket number'),
        expect.objectContaining({ queueId, newTicketNumber })
      );
    });

    it('should handle storage adapter errors', async () => {
      // Setup
      const queueId = 'queue1';
      const error = new Error('Storage error');
      mockStorageAdapter.increment.mockRejectedValue(error);

      // Execute and verify
      await expect(queueRepository.incrementTicketNumber(queueId)).rejects.toThrow('Failed to increment ticket number');
      expect(mockStorageAdapter.increment).toHaveBeenCalledWith(`queue:${queueId}`);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error incrementing ticket number'),
        expect.objectContaining({ 
          queueId,
          error: expect.any(Error)
        })
      );
    });
  });

  describe('resetTicketNumber', () => {
    it('should reset the ticket number for a queue to zero', async () => {
      // Setup
      const queueId = 'queue1';
      mockStorageAdapter.set.mockResolvedValue(true);

      // Execute
      const result = await queueRepository.resetTicketNumber(queueId);

      // Verify
      expect(result).toBe(true);
      expect(mockStorageAdapter.set).toHaveBeenCalledWith(`queue:${queueId}`, 0);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Reset ticket number'),
        expect.objectContaining({ queueId })
      );
    });

    it('should handle storage adapter errors', async () => {
      // Setup
      const queueId = 'queue1';
      const error = new Error('Storage error');
      mockStorageAdapter.set.mockRejectedValue(error);

      // Execute and verify
      await expect(queueRepository.resetTicketNumber(queueId)).rejects.toThrow('Failed to reset ticket number');
      expect(mockStorageAdapter.set).toHaveBeenCalledWith(`queue:${queueId}`, 0);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error resetting ticket number'),
        expect.objectContaining({ 
          queueId,
          error: expect.any(Error)
        })
      );
    });
  });

  describe('deleteQueue', () => {
    it('should delete a queue', async () => {
      // Setup
      const queueId = 'queue1';
      mockStorageAdapter.delete.mockResolvedValue(true);

      // Execute
      const result = await queueRepository.deleteQueue(queueId);

      // Verify
      expect(result).toBe(true);
      expect(mockStorageAdapter.delete).toHaveBeenCalledWith(`queue:${queueId}`);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Deleted queue'),
        expect.objectContaining({ queueId })
      );
    });

    it('should handle storage adapter errors', async () => {
      // Setup
      const queueId = 'queue1';
      const error = new Error('Storage error');
      mockStorageAdapter.delete.mockRejectedValue(error);

      // Execute and verify
      await expect(queueRepository.deleteQueue(queueId)).rejects.toThrow('Failed to delete queue');
      expect(mockStorageAdapter.delete).toHaveBeenCalledWith(`queue:${queueId}`);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error deleting queue'),
        expect.objectContaining({ 
          queueId,
          error: expect.any(Error)
        })
      );
    });
  });

  describe('getQueueKey', () => {
    it('should return the correct key for a queue', () => {
      // Setup
      const queueId = 'queue1';
      
      // Execute
      const result = queueRepository.getQueueKey(queueId);
      
      // Verify
      expect(result).toBe('queue:queue1');
    });
    
    it('should handle special characters in queue ID', () => {
      // Setup
      const queueId = 'queue:with:colons';
      
      // Execute
      const result = queueRepository.getQueueKey(queueId);
      
      // Verify
      expect(result).toBe('queue:queue:with:colons');
    });
  });
});