/**
 * QueueRepository - класс для хранения и управления состоянием очередей
 */

class QueueRepository {
  /**
   * @param {Object} storageAdapter - адаптер для хранения данных
   */
  constructor(storageAdapter) {
    if (!storageAdapter) {
      throw new Error('Storage adapter is required');
    }
    this.storageAdapter = storageAdapter;
    this.MAX_TICKET_NUMBER = 9999;
  }

  /**
   * Получает текущий номер талона для указанной очереди
   * @param {string} queueId - идентификатор очереди
   * @returns {Promise<number>} - текущий номер талона
   */
  async getCurrentTicketNumber(queueId) {
    try {
      if (!queueId) {
        throw new Error('Queue ID is required');
      }
      
      const key = this._getQueueKey(queueId);
      const value = await this.storageAdapter.get(key);
      
      return value !== null ? parseInt(value, 10) : null;
    } catch (error) {
      console.error(`Error getting ticket number for queue ${queueId}:`, error);
      throw error;
    }
  }

  /**
   * Увеличивает номер талона для указанной очереди на 1
   * @param {string} queueId - идентификатор очереди
   * @returns {Promise<number>} - новый номер талона
   */
  async incrementTicketNumber(queueId) {
    try {
      if (!queueId) {
        throw new Error('Queue ID is required');
      }
      
      const key = this._getQueueKey(queueId);
      let currentNumber = await this.getCurrentTicketNumber(queueId);
      
      // Если очередь не существует или номер не определен
      if (currentNumber === null) {
        throw new Error(`Queue ${queueId} does not exist`);
      }
      
      // Увеличиваем номер и проверяем на превышение максимального значения
      let nextNumber = currentNumber + 1;
      if (nextNumber > this.MAX_TICKET_NUMBER) {
        nextNumber = 0;
      }
      
      // Сохраняем новое значение
      await this.storageAdapter.set(key, nextNumber);
      
      return nextNumber;
    } catch (error) {
      console.error(`Error incrementing ticket number for queue ${queueId}:`, error);
      throw error;
    }
  }

  /**
   * Сбрасывает номер талона для указанной очереди в 0
   * @param {string} queueId - идентификатор очереди
   * @returns {Promise<boolean>} - результат операции
   */
  async resetTicketNumber(queueId) {
    try {
      if (!queueId) {
        throw new Error('Queue ID is required');
      }
      
      const key = this._getQueueKey(queueId);
      await this.storageAdapter.set(key, 0);
      
      return true;
    } catch (error) {
      console.error(`Error resetting ticket number for queue ${queueId}:`, error);
      throw error;
    }
  }

  /**
   * Создает новую очередь с указанным идентификатором
   * @param {string} queueId - идентификатор очереди
   * @returns {Promise<boolean>} - результат операции
   */
  async createQueue(queueId) {
    try {
      if (!queueId) {
        throw new Error('Queue ID is required');
      }
      
      const key = this._getQueueKey(queueId);
      const exists = await this.getCurrentTicketNumber(queueId) !== null;
      
      if (exists) {
        throw new Error(`Queue ${queueId} already exists`);
      }
      
      await this.storageAdapter.set(key, 0);
      
      return true;
    } catch (error) {
      console.error(`Error creating queue ${queueId}:`, error);
      throw error;
    }
  }

  /**
   * Формирует ключ для хранения данных очереди
   * @private
   * @param {string} queueId - идентификатор очереди
   * @returns {string} - ключ для хранения
   */
  _getQueueKey(queueId) {
    return `queue:${queueId}:ticket`;
  }
}

module.exports = QueueRepository;
