/**
 * Сервис для управления очередями и выдачи талонов
 */
class QueueService {
  /**
   * @param {import('../repositories/QueueRepository')} queueRepository - Репозиторий для работы с данными очередей
   */
  constructor(queueRepository) {
    this.queueRepository = queueRepository;
    this.MAX_TICKET_NUMBER = 9999;
  }

  /**
   * Получение нового талона для указанной очереди
   * @param {string} queueId - Идентификатор очереди
   * @returns {Promise<string>} - Форматированный номер талона (4 цифры)
   */
  async getTicket(queueId) {
    try {
      // Получаем текущий номер талона для очереди
      let currentNumber = await this.queueRepository.getCurrentTicketNumber(queueId);
      
      // Увеличиваем номер талона на 1
      currentNumber = (currentNumber + 1) % (this.MAX_TICKET_NUMBER + 1);
      
      // Сохраняем новый номер талона
      await this.queueRepository.updateTicketNumber(queueId, currentNumber);
      
      // Форматируем номер талона в 4-значное число с ведущими нулями
      return this.formatTicketNumber(currentNumber);
    } catch (error) {
      console.error(`Error getting ticket for queue ${queueId}:`, error);
      throw new Error(`Failed to get ticket for queue ${queueId}`);
    }
  }

  /**
   * Сброс счетчика талонов для указанной очереди
   * @param {string} queueId - Идентификатор очереди
   * @returns {Promise<boolean>} - Результат операции сброса
   */
  async resetQueue(queueId) {
    try {
      await this.queueRepository.updateTicketNumber(queueId, 0);
      return true;
    } catch (error) {
      console.error(`Error resetting queue ${queueId}:`, error);
      throw new Error(`Failed to reset queue ${queueId}`);
    }
  }

  /**
   * Получение текущего статуса очереди
   * @param {string} queueId - Идентификатор очереди
   * @returns {Promise<{queueId: string, currentTicket: string, ticketCount: number}>} - Статус очереди
   */
  async getQueueStatus(queueId) {
    try {
      const currentNumber = await this.queueRepository.getCurrentTicketNumber(queueId);
      return {
        queueId,
        currentTicket: this.formatTicketNumber(currentNumber),
        ticketCount: currentNumber
      };
    } catch (error) {
      console.error(`Error getting status for queue ${queueId}:`, error);
      throw new Error(`Failed to get status for queue ${queueId}`);
    }
  }

  /**
   * Форматирование номера талона в 4-значное число с ведущими нулями
   * @param {number} number - Номер талона
   * @returns {string} - Форматированный номер талона
   * @private
   */
  formatTicketNumber(number) {
    return number.toString().padStart(4, '0');
  }
}

module.exports = QueueService;
