// Simple in-memory rate limiter for development and single-container deployments.
// In a serverless production environment, this should be replaced with Upstash Redis or a similar external cache.

const rateLimitStore = new Map();

/**
 * Checks if a user/IP is rate limited
 * @param {string} key - Unique identifier (e.g. IP address or session hash)
 * @param {number} limit - Maximum number of allowed requests in the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<{ isLimited: boolean, remaining: number, resetTime: number }>}
 */
export async function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const resetTime = now + windowMs;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, [{ timestamp: now }]);
    return { isLimited: false, remaining: limit - 1, resetTime };
  }

  const userRequests = rateLimitStore.get(key);
  // Filter out requests outside the sliding window
  const activeRequests = userRequests.filter(req => now - req.timestamp < windowMs);
  
  if (activeRequests.length >= limit) {
    // Limited! Find when the oldest request expires to calculate reset time
    const oldestExpiry = activeRequests[0].timestamp + windowMs;
    rateLimitStore.set(key, activeRequests); // Clean up store
    return { isLimited: true, remaining: 0, resetTime: oldestExpiry };
  }

  // Add current request
  activeRequests.push({ timestamp: now });
  rateLimitStore.set(key, activeRequests);
  
  return { 
    isLimited: false, 
    remaining: limit - activeRequests.length, 
    resetTime: activeRequests[0].timestamp + windowMs 
  };
}

// Configured limits
export const RATE_LIMITS = {
  POST_CREATE: { limit: 5, windowMs: 3600000 },    // 5 posts per hour
  COMMENT_CREATE: { limit: 15, windowMs: 60000 },   // 15 comments per minute
  REACTION_TOGGLE: { limit: 60, windowMs: 60000 }   // 60 reactions per minute
};
