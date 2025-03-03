/**
 * Logger.js
 * Логирование событий в системе талонизатора
 */

const winston = require('winston');

class Logger {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'queue-ticket-service' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
            })
          )
        })
      ]
    });

    // Добавляем файловый транспорт в продакшн-режиме
    if (process.env.NODE_ENV === 'production') {
      this.logger.add(new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error' 
      }));
      this.logger.add(new winston.transports.File({ 
        filename: 'logs/combined.log' 
      }));
    }
  }

  /**
   * Логирование информационных сообщений
   * @param {string} message - Сообщение для логирования
   * @param {Object} meta - Дополнительные метаданные
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Логирование ошибок
   * @param {string} message - Сообщение об ошибке
   * @param {Object} meta - Дополнительные метаданные
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  /**
   * Логирование предупреждений
   * @param {string} message - Предупреждающее сообщение
   * @param {Object} meta - Дополнительные метаданные
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Логирование отладочной информации
   * @param {string} message - Отладочное сообщение
   * @param {Object} meta - Дополнительные метаданные
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

// Создаем синглтон для использования во всем приложении
const loggerInstance = new Logger();

module.exports = {
  Logger: {
    info: (message, meta) => loggerInstance.info(message, meta),
    error: (message, meta) => loggerInstance.error(message, meta),
    warn: (message, meta) => loggerInstance.warn(message, meta),
    debug: (message, meta) => loggerInstance.debug(message, meta)
  }
};
