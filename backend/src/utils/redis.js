/**
 * Redis Client Utility
 * 
 * Provides caching for high-traffic endpoints with TTL management.
 * Uses AWS ElastiCache for Redis in production.
 */

const redis = require('redis');

let client = null;

/**
 * Initialize Redis client
 * @returns {Promise<RedisClient>}
 */
async function getRedisClient() {
  if (client && client.isOpen) {
    return client;
  }

  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = process.env.REDIS_PORT || 6379;

  client = redis.createClient({
    socket: {
      host: redisHost,
      port: parseInt(redisPort, 10),
    },
    // Disable connection timeout for Lambda cold starts
    socket: {
      connectTimeout: 10000,
    },
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  try {
    await client.connect();
    console.log('Redis connected successfully');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    client = null;
    throw err;
  }

  return client;
}

/**
 * Get cached value by key
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Parsed JSON value or null
 */
async function getCache(key) {
  try {
    const redisClient = await getRedisClient();
    const value = await redisClient.get(key);
    
    if (!value) return null;
    
    return JSON.parse(value);
  } catch (err) {
    console.error(`Redis GET error for key ${key}:`, err);
    return null;
  }
}

/**
 * Set cache value with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<boolean>} - Success status
 */
async function setCache(key, value, ttl = 300) {
  try {
    const redisClient = await getRedisClient();
    const stringValue = JSON.stringify(value);
    
    await redisClient.setEx(key, ttl, stringValue);
    return true;
  } catch (err) {
    console.error(`Redis SET error for key ${key}:`, err);
    return false;
  }
}

/**
 * Delete cache key
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
async function deleteCache(key) {
  try {
    const redisClient = await getRedisClient();
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.error(`Redis DEL error for key ${key}:`, err);
    return false;
  }
}

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., 'movements:*')
 * @returns {Promise<number>} - Number of keys deleted
 */
async function deleteCachePattern(pattern) {
  try {
    const redisClient = await getRedisClient();
    const keys = await redisClient.keys(pattern);
    
    if (keys.length === 0) return 0;
    
    await redisClient.del(keys);
    return keys.length;
  } catch (err) {
    console.error(`Redis pattern delete error for ${pattern}:`, err);
    return 0;
  }
}

/**
 * Cache helper that wraps a function with caching logic
 * @param {string} key - Cache key
 * @param {Function} fetchFunction - Async function to fetch data if not cached
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} - Cached or fresh data
 */
async function cacheWrapper(key, fetchFunction, ttl = 300) {
  // Try to get from cache
  const cached = await getCache(key);
  if (cached !== null) {
    console.log(`Cache HIT: ${key}`);
    return cached;
  }

  console.log(`Cache MISS: ${key}`);

  // Fetch fresh data
  const freshData = await fetchFunction();

  // Store in cache (non-blocking)
  setCache(key, freshData, ttl).catch((err) =>
    console.error(`Failed to cache ${key}:`, err)
  );

  return freshData;
}

/**
 * Close Redis connection (for cleanup)
 */
async function closeRedis() {
  if (client && client.isOpen) {
    await client.quit();
    client = null;
  }
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  cacheWrapper,
  closeRedis,
};
