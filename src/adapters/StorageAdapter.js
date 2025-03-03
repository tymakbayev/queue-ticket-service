/**
 * StorageAdapter.js
 * Абстракция для работы с хранилищем данных в микросервисе-талонизаторе
 */

const { Logger } = require('../utils/Logger');
const { ErrorHandler } = require('../utils/ErrorHandler');

/**
 * Абстрактный класс адаптера хранилища
 * @abstract
 */
class StorageAdapter {
  /**
   * @constructor
   */
  constructor() {
    if (this.constructor === StorageAdapter) {
      throw new Error('StorageAdapter is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Получает значение по ключу
   * @param {string} key - Ключ для получения значения
   * @returns {Promise<any>} - Значение из хранилища
   * @abstract
   */
  async get(key) {
    throw new Error('Method get() must be implemented');
  }

  /**
   * Устанавливает значение по ключу
   * @param {string} key - Ключ для сохранения
   * @param {any} value - Значение для сохранения
   * @returns {Promise<boolean>} - Результат операции
   * @abstract
   */
  async set(key, value) {
    throw new Error('Method set() must be implemented');
  }

  /**
   * Удаляет значение по ключу
   * @param {string} key - Ключ для удаления
   * @returns {Promise<boolean>} - Результат операции
   * @abstract
   */
  async delete(key) {
    throw new Error('Method delete() must be implemented');
  }
}

/**
 * Реализация адаптера хранилища в памяти
 * @extends StorageAdapter
 */
class InMemoryStorageAdapter extends StorageAdapter {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.storage = new Map();
    Logger.info('InMemoryStorageAdapter initialized');
  }

  /**
   * @inheritdoc
   */
  async get(key) {
    try {
      Logger.debug(`Getting value for key: ${key}`);
      return this.storage.get(key);
    } catch (error) {
      Logger.error(`Error getting value for key: ${key}`, { error: error.message });
      throw ErrorHandler.createError(`Failed to get value for key: ${key}`, 500);
    }
  }

  /**
   * @inheritdoc
   */
  async set(key, value) {
    try {
      Logger.debug(`Setting value for key: ${key}`, { value });
      this.storage.set(key, value);
      return true;
    } catch (error) {
      Logger.error(`Error setting value for key: ${key}`, { error: error.message, value });
      throw ErrorHandler.createError(`Failed to set value for key: ${key}`, 500);
    }
  }

  /**
   * @inheritdoc
   */
  async delete(key) {
    try {
      Logger.debug(`Deleting key: ${key}`);
      return this.storage.delete(key);
    } catch (error) {
      Logger.error(`Error deleting key: ${key}`, { error: error.message });
      throw ErrorHandler.createError(`Failed to delete key: ${key}`, 500);
    }
  }
}

/**
 * Реализация адаптера хранилища Redis
 * @extends StorageAdapter
 */
class RedisStorageAdapter extends StorageAdapter {
  /**
   * @constructor
   * @param {Object} options - Опции подключения к Redis
   */
  constructor(options = {}) {
    super();
    this.redis = null;
    this.options = options;
    this.initialize();
  }

  /**
   * Инициализирует подключение к Redis
   * @private
   */
  async initialize() {
    try {
      // Динамический импорт для поддержки опционального использования Redis
      const { createClient } = await import('redis');
      
      this.redis = createClient(this.options);
      
      this.redis.on('error', (error) => {
        Logger.error('Redis connection error', { error: error.message });
      });
      
      this.redis.on('connect', () => {
        Logger.info('Connected to Redis successfully');
      });
      
      await this.redis.connect();
    } catch (error) {
      Logger.error('Failed to initialize Redis client', { error: error.message });
      throw ErrorHandler.createError('Redis initialization failed', 500);
    }
  }

  /**
   * @inheritdoc
   */
  async get(key) {
    try {
      if (!this.redis) await this.initialize();
      Logger.debug(`Getting value from Redis for key: ${key}`);
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      Logger.error(`Error getting value from Redis for key: ${key}`, { error: error.message });
      throw ErrorHandler.createError(`Failed to get value from Redis for key: ${key}`, 500);
    }
  }

  /**
   * @inheritdoc
   */
  async set(key, value) {
    try {
      if (!this.redis) await this.initialize();
      Logger.debug(`Setting value in Redis for key: ${key}`, { value });
      await this.redis.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      Logger.error(`Error setting value in Redis for key: ${key}`, { error: error.message, value });
      throw ErrorHandler.createError(`Failed to set value in Redis for key: ${key}`, 500);
    }
  }

  /**
   * @inheritdoc
   */
  async delete(key) {
    try {
      if (!this.redis) await this.initialize();
      Logger.debug(`Deleting key from Redis: ${key}`);
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      Logger.error(`Error deleting key from Redis: ${key}`, { error: error.message });
      throw ErrorHandler.createError(`Failed to delete key from Redis: ${key}`, 500);
    }
  }

  /**
   * Закрывает соединение с Redis
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
      Logger.info('Redis connection closed');
    }
  }
}

/**
 * Фабрика для создания адаптера хранилища
 */
class StorageAdapterFactory {
  /**
   * Создает экземпляр адаптера хранилища на основе конфигурации
   * @param {string} type - Тип хранилища ('memory' или 'redis')
   * @param {Object} options - Опции для инициализации хранилища
   * @returns {StorageAdapter} - Экземпляр адаптера хранилища
   */
  static createAdapter(type = 'memory', options = {}) {
    switch (type.toLowerCase()) {
      case 'redis':
        return new RedisStorageAdapter(options);
      case 'memory':
      default:
        return new InMemoryStorageAdapter();
    }
  }
}

module.exports = {
  StorageAdapter,
  InMemoryStorageAdapter,
  RedisStorageAdapter,
  StorageAdapterFactory
};
