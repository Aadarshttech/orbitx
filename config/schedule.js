// Schedule configuration
// Defines optimal posting times and scheduling rules

// Optimal posting windows based on engagement research
// Times are in 24h format, adjusted for target audience overlap
export const POSTING_WINDOWS = {
  w1: { hour: 1, minute: 0, days: [1, 2, 3, 4, 5, 6, 0], label: '1:00 AM' },
  w2: { hour: 3, minute: 0, days: [1, 2, 3, 4, 5, 6, 0], label: '3:00 AM' },
  w3: { hour: 15, minute: 0, days: [1, 2, 3, 4, 5, 6, 0], label: '3:00 PM' },
  w4: { hour: 18, minute: 0, days: [1, 2, 3, 4, 5, 6, 0], label: '6:00 PM' },
  w5: { hour: 21, minute: 0, days: [1, 2, 3, 4, 5, 6, 0], label: '9:00 PM' },
};

// Engagement window — the critical first 30 mins after posting
export const ENGAGEMENT_WINDOW = {
  durationMinutes: 30,
  alertEnabled: true,
  message: '🔔 Your tweet just went live! Engage with replies in the next 30 mins for max reach.',
};

// Content generation schedule
export const GENERATION = {
  batchSize: 7, // Generate 7 days of content at a time
  refillThreshold: 3, // Auto-refill when queue drops below 3
  previewDays: 3, // Show next 3 days in preview
};

// Rate limiting (browser automation safety)
export const RATE_LIMITS = {
  minDelayBetweenPosts: 60 * 1000, // 1 min minimum between posts
  maxPostsPerDay: 5,
  maxThreadsPerDay: 2,
  cooldownAfterError: 5 * 60 * 1000, // 5 min cooldown after error
};

// Cron expressions for node-cron (these get built dynamically from POSTING_WINDOWS)
export function buildCronExpression(window, timezone) {
  const { minute, hour, days } = window;
  return {
    expression: `${minute} ${hour} * * ${days.join(',')}`,
    timezone: timezone || process.env.TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };
}
