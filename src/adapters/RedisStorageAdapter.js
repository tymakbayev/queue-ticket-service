/**
 * Redis Storage Adapter для микросервиса-талонизатора
 * Обеспечивает взаимодействие с Redis для хранения состояния очередей
 */

const { createClient } = require('redis');

class RedisStorageAdapter {
  /**
   * Создает экземпляр адаптера хранилища Redis
   * @param {Object} options - Опции подключения к Redis
   * @param {string} [options.url='redis://localhost:6379'] - URL подключения к Redis
   * @param {number} [options.connectTimeout=5000] - Таймаут подключения в мс
   */
  constructor(options = {}) {
    const { url = 'redis://localhost:6379', connectTimeout = 5000 } = options;
    
    this.client = createClient({
      url,
      socket: {
        connectTimeout
      }
    });
    
    this.isConnected = false;
    this.connectionPromise = null;
  }

  /**
   * Устанавливает соединение с Redis
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.isConnected) return;
    
    if (!this.connectionPromise) {
      this.connectionPromise = new Promise((resolve, reject) => {
        this.client.on('error', (err) => {
          console.error('Redis connection error:', err);
          reject(err);
        });
        
        this.client.connect()
          .then(() => {
            this.isConnected = true;
            console.log('Connected to Redis successfully');
            resolve();
          })
          .catch(reject);
      });
    }
    
    return this.connectionPromise;
  }

  /**
   * Получает значение по ключу из Redis
   * @param {string} key - Ключ для получения значения
   * @returns {Promise<any>} - Значение из Redis или null, если ключ не найден
   * @throws {Error} - Если возникла ошибка при получении данных
   */
  async get(key) {
    try {
      await this.connect();
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting key ${key} from Redis:`, error);
      throw new Error(`Failed to get data from Redis: ${error.message}`);
    }
  }

  /**
   * Устанавливает значение по ключу в Redis
   * @param {string} key - Ключ для сохранения значения
   * @param {any} value - Значение для сохранения
   * @param {Object} [options] - Дополнительные опции
   * @param {number} [options.ttl] - Время жизни ключа в секундах
   * @returns {Promise<boolean>} - true в случае успеха
   * @throws {Error} - Если возникла ошибка при сохранении данных
   */
  async set(key, value, options = {}) {
    try {
      await this.connect();
      const serializedValue = JSON.stringify(value);
      
      if (options.ttl) {
        await this.client.setEx(key, options.ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      console.error(`Error setting key ${key} in Redis:`, error);
      throw new Error(`Failed to save data to Redis: ${error.message}`);
    }
  }

  /**
   * Удаляет значение по ключу из Redis
   * @param {string} key - Ключ для удаления
   * @returns {Promise<boolean>} - true если ключ был удален, false если ключ не существовал
   * @throws {Error} - Если возникла ошибка при удалении данных
   */
  async delete(key) {
    try {
      await this.connect();
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Error deleting key ${key} from Redis:`, error);
      throw new Error(`Failed to delete data from Redis: ${error.message}`);
    }
  }

  /**
   * Инкрементирует значение по ключу и возвращает новое значение
   * Если ключ не существует, он будет создан со значением 0 перед инкрементом
   * @param {string} key - Ключ для инкремента
   * @returns {Promise<number>} - Новое значение после инкремента
   * @throws {Error} - Если возникла ошибка при инкременте
   */
  async increment(key) {
    try {
      await this.connect();
      const newValue = await this.client.incr(key);
      return newValue;
    } catch (error) {
      console.error(`Error incrementing key ${key} in Redis:`, error);
      throw new Error(`Failed to increment value in Redis: ${error.message}`);
    }
  }

  /**
   * Закрывает соединение с Redis
   * @returns {Promise<void>}
   */
  async close() {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('Redis connection closed');
    }
  }
}

module.exports = RedisStorageAdapter;
