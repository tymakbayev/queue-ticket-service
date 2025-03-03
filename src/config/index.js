/**
 * Configuration module for the ticket service
 * Loads environment variables and provides configuration methods
 */

require('dotenv').config();

/**
 * Default configuration values
 */
const DEFAULT_PORT = 3000;
const DEFAULT_STORAGE_TYPE = 'memory'; // 'memory' or 'redis'
const DEFAULT_REDIS_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;

/**
 * Returns the storage type to use (memory or redis)
 * @returns {string} Storage type
 */
function getStorageType() {
  return process.env.STORAGE_TYPE || DEFAULT_STORAGE_TYPE;
}

/**
 * Returns the port number for the server
 * @returns {number} Port number
 */
function getPort() {
  const port = parseInt(process.env.PORT, 10);
  return isNaN(port) ? DEFAULT_PORT : port;
}

/**
 * Returns Redis configuration
 * @returns {object} Redis configuration object
 */
function getRedisConfig() {
  return {
    host: process.env.REDIS_HOST || DEFAULT_REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || DEFAULT_REDIS_PORT,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'ticket:'
  };
}

module.exports = {
  getStorageType,
  getPort,
  getRedisConfig
};
