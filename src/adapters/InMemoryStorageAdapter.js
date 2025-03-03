/**
 * InMemoryStorageAdapter - адаптер для хранения данных в памяти
 * Используется для тестирования и разработки
 */
class InMemoryStorageAdapter {
  /**
   * Создает новый экземпляр адаптера хранилища в памяти
   */
  constructor() {
    this.storage = new Map();
  }
  async connect() {
    console.log("Connected to in-memory storage");
  }
  /**
   * Получает значение по ключу
   * @param {string} key - Ключ для получения значения
   * @returns {Promise<any>} - Значение, связанное с ключом, или null если ключ не найден
   */
  async get(key) {
    try {
      return this.storage.has(key) ? this.storage.get(key) : null;
    } catch (error) {
      console.error(`Ошибка при получении значения по ключу ${key}:`, error);
      throw new Error(`Не удалось получить значение по ключу ${key}: ${error.message}`);
    }
  }

  /**
   * Устанавливает значение по ключу
   * @param {string} key - Ключ для сохранения значения
   * @param {any} value - Значение для сохранения
   * @returns {Promise<boolean>} - true, если операция выполнена успешно
   */
  async set(key, value) {
    try {
      this.storage.set(key, value);
      return true;
    } catch (error) {
      console.error(`Ошибка при установке значения по ключу ${key}:`, error);
      throw new Error(`Не удалось установить значение по ключу ${key}: ${error.message}`);
    }
  }

  /**
   * Удаляет значение по ключу
   * @param {string} key - Ключ для удаления
   * @returns {Promise<boolean>} - true, если значение было удалено, false если ключ не найден
   */
  async delete(key) {
    try {
      return this.storage.delete(key);
    } catch (error) {
      console.error(`Ошибка при удалении значения по ключу ${key}:`, error);
      throw new Error(`Не удалось удалить значение по ключу ${key}: ${error.message}`);
    }
  }

  /**
   * Очищает все хранилище
   * @returns {Promise<boolean>} - true, если операция выполнена успешно
   */
  async clear() {
    try {
      this.storage.clear();
      return true;
    } catch (error) {
      console.error('Ошибка при очистке хранилища:', error);
      throw new Error(`Не удалось очистить хранилище: ${error.message}`);
    }
  }
}

module.exports = InMemoryStorageAdapter;
