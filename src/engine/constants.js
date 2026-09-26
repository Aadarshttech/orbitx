/**
 * OrbitX Campaign Engine Constants
 * Standardized configuration constants, rate limits, and timing intervals.
 */

export const ENGINE_CONSTANTS = {
  // Campaign defaults
  DEFAULT_CAMPAIGN_DAYS: 100,
  DEFAULT_PORT: 3847,
  DEFAULT_TIMEZONE: 'UTC',

  // Character limit rules
  MAX_TWEET_LENGTH: 280,
  OPTIMAL_TWEET_MIN: 70,
  OPTIMAL_TWEET_MAX: 240,

  // Safety & Evasion Timing (milliseconds)
  DELAYS: {
    MIN_KEYSTROKE_MS: 35,
    MAX_KEYSTROKE_MS: 120,
    POST_PUBLISH_WAIT_MS: 4000,
    PAGE_LOAD_TIMEOUT_MS: 30000,
    DOM_STABILIZATION_MS: 1500,
  },

  // Content Pillar distribution weights (sum to 1.0)
  PILLAR_WEIGHTS: {
    ENGINEERING_DEEP_DIVE: 0.35,
    QUICK_TIPS_SNIPPETS: 0.25,
    INDUSTRY_INSIGHTS: 0.20,
    COMMUNITY_ENGAGEMENT: 0.20,
  },

  // HTTP Status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  }
};

export default ENGINE_CONSTANTS;
