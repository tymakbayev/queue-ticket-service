/**
 * Ticket.js
 * Модель талона для очереди в микросервисе-талонизаторе
 * 
 * Представляет собой структуру данных талона, выдаваемого для очереди.
 * Содержит логику форматирования и валидации номеров талонов.
 */

/**
 * Максимальное значение номера талона (9999)
 * @type {number}
 */
const MAX_TICKET_NUMBER = 9999;

/**
 * Минимальное значение номера талона (0)
 * @type {number}
 */
const MIN_TICKET_NUMBER = 0;

/**
 * Класс, представляющий талон в системе очередей
 */
class Ticket {
  /**
   * Создает новый экземпляр талона
   * @param {string} queueId - Идентификатор очереди
   * @param {number} number - Номер талона (0-9999)
   * @param {Date} [createdAt=new Date()] - Дата и время создания талона
   */
  constructor(queueId, number, createdAt = new Date()) {
    if (!queueId) {
      throw new Error('Queue ID is required');
    }

    if (typeof number !== 'number' || number < MIN_TICKET_NUMBER || number > MAX_TICKET_NUMBER) {
      throw new Error(`Ticket number must be between ${MIN_TICKET_NUMBER} and ${MAX_TICKET_NUMBER}`);
    }

    this.queueId = queueId;
    this.number = number;
    this.formattedNumber = Ticket.formatNumber(number);
    this.createdAt = createdAt;
  }

  /**
   * Форматирует числовой номер талона в четырехзначную строку с ведущими нулями
   * @param {number} number - Номер талона для форматирования
   * @returns {string} Отформатированный номер талона (например, "0042")
   * @static
   */
  static formatNumber(number) {
    if (typeof number !== 'number' || number < MIN_TICKET_NUMBER || number > MAX_TICKET_NUMBER) {
      throw new Error(`Invalid ticket number: ${number}. Must be between ${MIN_TICKET_NUMBER} and ${MAX_TICKET_NUMBER}`);
    }
    return number.toString().padStart(4, '0');
  }

  /**
   * Вычисляет следующий номер талона с учетом цикличности
   * @param {number} currentNumber - Текущий номер талона
   * @returns {number} Следующий номер талона
   * @static
   */
  static getNextNumber(currentNumber) {
    if (typeof currentNumber !== 'number') {
      throw new Error('Current number must be a number');
    }
    
    // Проверка на валидность текущего номера
    if (currentNumber < MIN_TICKET_NUMBER || currentNumber > MAX_TICKET_NUMBER) {
      throw new Error(`Current number must be between ${MIN_TICKET_NUMBER} and ${MAX_TICKET_NUMBER}`);
    }
    
    // Вычисление следующего номера с учетом цикличности
    return currentNumber === MAX_TICKET_NUMBER ? MIN_TICKET_NUMBER : currentNumber + 1;
  }

  /**
   * Создает новый талон с инкрементированным номером
   * @param {string} queueId - Идентификатор очереди
   * @param {number} currentNumber - Текущий номер талона
   * @returns {Ticket} Новый талон с инкрементированным номером
   * @static
   */
  static createNext(queueId, currentNumber) {
    const nextNumber = Ticket.getNextNumber(currentNumber);
    return new Ticket(queueId, nextNumber);
  }

  /**
   * Проверяет, является ли номер талона валидным
   * @param {number} number - Номер для проверки
   * @returns {boolean} true, если номер валидный, иначе false
   * @static
   */
  static isValidNumber(number) {
    return (
      typeof number === 'number' && 
      Number.isInteger(number) && 
      number >= MIN_TICKET_NUMBER && 
      number <= MAX_TICKET_NUMBER
    );
  }

  /**
   * Преобразует объект талона в JSON-представление
   * @returns {Object} JSON-представление талона
   */
  toJSON() {
    return {
      queueId: this.queueId,
      number: this.number,
      formattedNumber: this.formattedNumber,
      createdAt: this.createdAt.toISOString()
    };
  }

  /**
   * Создает экземпляр талона из JSON-объекта
   * @param {Object} data - JSON-представление талона
   * @returns {Ticket} Экземпляр талона
   * @static
   */
  static fromJSON(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid ticket data');
    }

    const { queueId, number, createdAt } = data;
    return new Ticket(
      queueId,
      number,
      createdAt ? new Date(createdAt) : new Date()
    );
  }
}

// Экспорт класса и констант
module.exports = {
  Ticket,
  MAX_TICKET_NUMBER,
  MIN_TICKET_NUMBER
};