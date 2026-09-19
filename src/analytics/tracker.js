// Analytics Tracker
// Tracks campaign performance and generates reports

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const ANALYTICS_FILE = join(DATA_DIR, 'analytics.json');

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Load analytics data
 */
export async function loadAnalytics() {
  await ensureDataDir();
  try {
    const data = await readFile(ANALYTICS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      totalPosts: 0,
      totalThreads: 0,
      postsPerPillar: {},
      postsPerDay: {},
      apiCost: 0, // Always $0 with browser automation!
      startDate: null,
      lastUpdated: null,
      streak: 0,
      longestStreak: 0,
      weeklyReport: [],
    };
  }
}

/**
 * Save analytics data
 */
async function saveAnalytics(analytics) {
  await ensureDataDir();
  analytics.lastUpdated = new Date().toISOString();
  await writeFile(ANALYTICS_FILE, JSON.stringify(analytics, null, 2), 'utf-8');
}

/**
 * Record a new post
 */
export async function recordPost(tweet) {
  const analytics = await loadAnalytics();

  analytics.totalPosts++;
  if (!analytics.startDate) {
    analytics.startDate = new Date().toISOString();
  }

  // Track by pillar
  const pillar = tweet.pillarName || tweet.pillar || 'Unknown';
  analytics.postsPerPillar[pillar] = (analytics.postsPerPillar[pillar] || 0) + 1;

  // Track by day of week
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  analytics.postsPerDay[dayName] = (analytics.postsPerDay[dayName] || 0) + 1;

  // Update streak
  analytics.streak++;
  if (analytics.streak > analytics.longestStreak) {
    analytics.longestStreak = analytics.streak;
  }

  await saveAnalytics(analytics);
}

/**
 * Display campaign status report
 */
export async function showReport() {
  const analytics = await loadAnalytics();

  logger.banner();
  logger.divider();
  console.log(chalk.cyan.bold('  📊 CAMPAIGN ANALYTICS'));
  logger.divider();

  // Progress
  const progress = Math.round((analytics.totalPosts / 100) * 100);
  const progressBar = generateProgressBar(progress);
  console.log(`\n  Campaign Progress: ${progressBar} ${progress}%`);
  console.log(`  Posts: ${analytics.totalPosts}/100`);
  console.log(`  Current Streak: 🔥 ${analytics.streak} days`);
  console.log(`  Longest Streak: 🏆 ${analytics.longestStreak} days`);

  // Cost
  console.log(`\n  💰 Total API Cost: ${chalk.green('$0.00')} ${chalk.gray('(Browser automation = FREE)')}`);

  // Pillar breakdown
  if (Object.keys(analytics.postsPerPillar).length > 0) {
    console.log(chalk.cyan('\n  📋 Content Pillar Breakdown:'));
    const totalPillarPosts = Object.values(analytics.postsPerPillar).reduce((a, b) => a + b, 0);
    for (const [pillar, count] of Object.entries(analytics.postsPerPillar)) {
      const pct = Math.round((count / totalPillarPosts) * 100);
      const bar = generateMiniBar(pct);
      console.log(`    ${pillar}: ${bar} ${count} (${pct}%)`);
    }
  }

  // Day of week breakdown
  if (Object.keys(analytics.postsPerDay).length > 0) {
    console.log(chalk.cyan('\n  📅 Posts by Day:'));
    for (const [day, count] of Object.entries(analytics.postsPerDay)) {
      const bar = generateMiniBar(count * 10);
      console.log(`    ${day.padEnd(10)}: ${bar} ${count}`);
    }
  }

  // Timeline
  if (analytics.startDate) {
    const start = new Date(analytics.startDate);
    const now = new Date();
    const daysElapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    const endDate = new Date(start.getTime() + 100 * 24 * 60 * 60 * 1000);
    console.log(chalk.cyan('\n  📅 Timeline:'));
    console.log(`    Started: ${start.toLocaleDateString()}`);
    console.log(`    Days elapsed: ${daysElapsed}`);
    console.log(`    Estimated completion: ${endDate.toLocaleDateString()}`);
  }

  logger.divider();
  console.log('');
}

/**
 * Generate an ASCII progress bar
 */
function generateProgressBar(percentage, width = 25) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  return `[${bar}]`;
}

/**
 * Generate a mini bar for breakdowns
 */
function generateMiniBar(percentage, width = 15) {
  const filled = Math.min(Math.round((percentage / 100) * width), width);
  return chalk.cyan('▓'.repeat(filled)) + chalk.gray('░'.repeat(width - filled));
}

/**
 * Get analytics data for dashboard API
 */
export async function getAnalyticsData() {
  return loadAnalytics();
}
