/**
 * ErrorHandler.js
 * Централизованная обработка ошибок для микросервиса-талонизатора
 */

const Logger = require('./Logger');

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorHandler {
  /**
   * Создает новый объект ошибки с указанным сообщением и кодом статуса
   * @param {string} message - Сообщение об ошибке
   * @param {number} statusCode - HTTP код статуса
   * @returns {AppError} - Объект ошибки
   */
  static createError(message, statusCode = 500) {
    return new AppError(message, statusCode);
  }

  /**
   * Обрабатывает ошибки в Express middleware
   * @param {Error} error - Объект ошибки
   * @param {Object} req - Express request объект
   * @param {Object} res - Express response объект
   * @param {Function} next - Express next функция
   */
  static handleError(error, req, res, next) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Внутренняя ошибка сервера';

    Logger.error(`[${statusCode}] ${message}`, {
      path: req.path,
      method: req.method,
      stack: error.stack,
      requestId: req.id
    });

    res.status(statusCode).json({
      status: 'error',
      message,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Асинхронный обработчик ошибок для промисов
   * @param {Function} fn - Асинхронная функция
   * @returns {Function} - Обернутая функция с обработкой ошибок
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = ErrorHandler, AppError;
