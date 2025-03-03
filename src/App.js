const express = require('express');
const http = require('http');
const ErrorHandler = require('./utils/ErrorHandler');

/**
 * Основной класс приложения, инициализирующий все компоненты
 */
class App {
  /**
   * @param {object} config - Конфигурация приложения
   * @param {import('./controllers/TicketController')} ticketController - Контроллер талонов
   * @param {import('./utils/ErrorHandler')} errorHandler - Обработчик ошибок
   * @param {import('./utils/Logger')} logger - Логгер
   * @param {import('./services/QueueService')} queueService - Сервис очередей
   * @param {import('./repositories/QueueRepository')} queueRepository - Репозиторий очередей
   * @param {import('./adapters/StorageAdapter')} storageAdapter - Адаптер хранилища
   */
  constructor(config, ticketController, errorHandler, logger, queueService, queueRepository, storageAdapter) {
    this.config = config;
    this.ticketController = ticketController;
    this.errorHandler = errorHandler;
    this.logger = logger;
    this.queueService = queueService;
    this.queueRepository = queueRepository;
    this.storageAdapter = storageAdapter;

    this.app = express();
    this.server = null;
  }

  /**
   * Инициализация приложения
   * @private
   */
  async initialize() {
    // Инициализация хранилища
    await this.storageAdapter.connect();

    // Настройка middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Настройка маршрутов
    const router = express.Router();
    this.ticketController.registerRoutes(router);
    this.app.use('/api', router);

    // Обработка ошибок
    this.app.use(ErrorHandler.handleError);
  }

  /**
   * Запуск приложения
   * @returns {Promise<void>}
   */
  async start() {
    try {
      await this.initialize();

      const port = this.config.port || 3000;
      this.server = http.createServer(this.app);

      return new Promise((resolve) => {
        this.server.listen(port, () => {
          this.logger.info(`Ticket service started on port ${port}`);
          resolve();
        });
      });
    } catch (error) {
      this.logger.error('Failed to start application:', error);
      throw error;
    }
  }

  /**
   * Остановка приложения
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(async () => {
          this.logger.info('Server stopped');
          await this.storageAdapter.disconnect();
          this.logger.info('Database connection closed');
          resolve();
        });
      });
    }
    return Promise.resolve();
  }
}

module.exports = App;
