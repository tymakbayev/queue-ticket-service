/**
 * Контроллер для обработки запросов, связанных с талонами очередей
 */
class TicketController {
  /**
   * @param {import('../services/QueueService')} queueService - Сервис управления очередями
   * @param {import('../utils/ErrorHandler')} errorHandler - Обработчик ошибок
   */
  constructor(queueService, errorHandler) {
    this.queueService = queueService;
    this.errorHandler = errorHandler;
  }

  /**
   * Получение нового талона для указанной очереди
   * @param {Express.Request} req - HTTP запрос
   * @param {Express.Response} res - HTTP ответ
   * @returns {Promise<void>}
   */
  getTicket = async (req, res) => {
    try {
      const { queueId } = req.params;
      
      if (!queueId) {
        return res.status(400).json({ error: 'Queue ID is required' });
      }

      const ticket = await this.queueService.getTicket(queueId);
      res.status(200).json({ ticket, queueId });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Сброс счетчика талонов для указанной очереди
   * @param {Express.Request} req - HTTP запрос
   * @param {Express.Response} res - HTTP ответ
   * @returns {Promise<void>}
   */
  resetQueue = async (req, res) => {
    try {
      const { queueId } = req.params;
      
      if (!queueId) {
        return res.status(400).json({ error: 'Queue ID is required' });
      }

      const result = await this.queueService.resetQueue(queueId);
      res.status(200).json({ success: result, queueId });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Получение текущего статуса очереди
   * @param {Express.Request} req - HTTP запрос
   * @param {Express.Response} res - HTTP ответ
   * @returns {Promise<void>}
   */
  getQueueStatus = async (req, res) => {
    try {
      const { queueId } = req.params;
      
      if (!queueId) {
        return res.status(400).json({ error: 'Queue ID is required' });
      }

      const status = await this.queueService.getQueueStatus(queueId);
      res.status(200).json(status);
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Регистрация маршрутов контроллера
   * @param {Express.Router} router - Экземпляр роутера Express
   */
  registerRoutes(router) {
    router.get('/queue/:queueId/ticket', this.getTicket);
    router.post('/queue/:queueId/reset', this.resetQueue);
    router.get('/queue/:queueId/status', this.getQueueStatus);
  }
}

module.exports = TicketController;
