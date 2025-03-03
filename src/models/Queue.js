/**
 * Queue.js
 * Модель очереди для микросервиса-талонизатора
 * 
 * Представляет собой структуру данных очереди, для которой выдаются талоны.
 * Содержит логику управления очередью и её состоянием.
 */

const Ticket = require('./Ticket');

/**
 * Класс, представляющий очередь в системе талонизатора
 */
class Queue {
  /**
   * Создает новый экземпляр очереди
   * @param {string} id - Уникальный идентификатор очереди
   * @param {string} [name=''] - Название очереди
   * @param {number} [currentTicketNumber=0] - Текущий номер талона в очереди
   * @param {Date} [createdAt=new Date()] - Дата и время создания очереди
   * @param {boolean} [isActive=true] - Активна ли очередь
   */
  constructor(id, name = '', currentTicketNumber = 0, createdAt = new Date(), isActive = true) {
    if (!id) {
      throw new Error('Queue ID is required');
    }

    if (!Ticket.isValidNumber(currentTicketNumber)) {
      throw new Error(`Invalid current ticket number: ${currentTicketNumber}`);
    }

    this.id = id;
    this.name = name;
    this.currentTicketNumber = currentTicketNumber;
    this.createdAt = createdAt;
    this.isActive = isActive;
    this.lastUpdatedAt = createdAt;
  }

  /**
   * Получает следующий номер талона для очереди
   * @returns {Ticket} Новый талон
   */
  getNextTicket() {
    const nextTicket = Ticket.createNext(this.id, this.currentTicketNumber);
    this.currentTicketNumber = nextTicket.number;
    this.lastUpdatedAt = new Date();
    return nextTicket;
  }

  /**
   * Сбрасывает счетчик талонов очереди в 0
   * @returns {Queue} Текущий экземпляр очереди с обновленным счетчиком
   */
  reset() {
    this.currentTicketNumber = 0;
    this.lastUpdatedAt = new Date();
    return this;
  }

  /**
   * Активирует очередь
   * @returns {Queue} Текущий экземпляр очереди
   */
  activate() {
    this.isActive = true;
    this.lastUpdatedAt = new Date();
    return this;
  }

  /**
   * Деактивирует очередь
   * @returns {Queue} Текущий экземпляр очереди
   */
  deactivate() {
    this.isActive = false;
    this.lastUpdatedAt = new Date();
    return this;
  }

  /**
   * Проверяет, активна ли очередь
   * @returns {boolean} true, если очередь активна, иначе false
   */
  isActiveQueue() {
    return this.isActive;
  }

  /**
   * Получает текущий номер талона в отформатированном виде
   * @returns {string} Отформатированный номер текущего талона
   */
  getCurrentFormattedTicketNumber() {
    return Ticket.formatNumber(this.currentTicketNumber);
  }

  /**
   * Обновляет название очереди
   * @param {string} name - Новое название очереди
   * @returns {Queue} Текущий экземпляр очереди
   */
  updateName(name) {
    this.name = name;
    this.lastUpdatedAt = new Date();
    return this;
  }

  /**
   * Устанавливает текущий номер талона
   * @param {number} number - Новый номер талона
   * @returns {Queue} Текущий экземпляр очереди
   * @throws {Error} Если номер талона невалидный
   */
  setCurrentTicketNumber(number) {
    if (!Ticket.isValidNumber(number)) {
      throw new Error(`Invalid ticket number: ${number}`);
    }
    
    this.currentTicketNumber = number;
    this.lastUpdatedAt = new Date();
    return this;
  }

  /**
   * Преобразует объект очереди в JSON-представление
   * @returns {Object} JSON-представление очереди
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      currentTicketNumber: this.currentTicketNumber,
      formattedTicketNumber: this.getCurrentFormattedTicketNumber(),
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      lastUpdatedAt: this.lastUpdatedAt.toISOString()
    };
  }

  /**
   * Создает экземпляр очереди из JSON-объекта
   * @param {Object} data - JSON-представление очереди
   * @returns {Queue} Экземпляр очереди
   * @static
   */
  static fromJSON(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid queue data');
    }

    const { id, name, currentTicketNumber, createdAt, isActive } = data;
    
    return new Queue(
      id,
      name || '',
      currentTicketNumber || 0,
      createdAt ? new Date(createdAt) : new Date(),
      isActive !== undefined ? isActive : true
    );
  }

  /**
   * Проверяет, является ли идентификатор очереди валидным
   * @param {string} queueId - Идентификатор для проверки
   * @returns {boolean} true, если идентификатор валидный, иначе false
   * @static
   */
  static isValidQueueId(queueId) {
    return typeof queueId === 'string' && queueId.trim().length > 0;
  }

  /**
   * Генерирует статистику по очереди
   * @returns {Object} Объект со статистикой очереди
   */
  getStatistics() {
    const now = new Date();
    const queueAge = now.getTime() - this.createdAt.getTime();
    const daysSinceCreation = Math.floor(queueAge / (1000 * 60 * 60 * 24));
    
    return {
      id: this.id,
      name: this.name,
      currentTicketNumber: this.currentTicketNumber,
      isActive: this.isActive,
      daysSinceCreation,
      averageTicketsPerDay: daysSinceCreation > 0 
        ? Math.round(this.currentTicketNumber / daysSinceCreation) 
        : this.currentTicketNumber
    };
  }
}

module.exports = Queue;