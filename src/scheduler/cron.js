// Cron Scheduler — automated posting with node-cron
// Runs in background and posts tweets at optimal times

import cron from 'node-cron';
import { POSTING_WINDOWS, ENGAGEMENT_WINDOW, buildCronExpression, GENERATION } from '../../config/schedule.js';
import { getNext, markPosted, fillQueue, loadQueue, getStatus } from './queue.js';
import { postTweet, postWithReply, verifySession } from '../twitter/client.js';
import { logger } from '../utils/logger.js';

let scheduledTask = null;
let isRunning = false;

/**
 * Start the automated posting scheduler
 * @param {boolean} dryRun - If true, previews instead of posting
 */
export async function startScheduler(dryRun = false) {
  if (isRunning) {
    logger.warn('Scheduler is already running!');
    return;
  }

  // Verify login session first
  if (!dryRun) {
    logger.info('Verifying X session...');
    const session = await verifySession();
    if (!session.valid) {
      logger.error(session.reason);
      return;
    }
    logger.success('Session verified ✅');
  }

  // Check queue
  const queue = await loadQueue();
  const pending = queue.tweets.filter(t => !t.posted).length;
  if (pending === 0) {
    logger.info('Queue is empty. Generating content...');
    await fillQueue(GENERATION.batchSize);
  }

  const timezone = process.env.TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  logger.banner();
  logger.schedule(`Scheduler started!`);
  logger.schedule(`Mode: ${dryRun ? '🔒 DRY RUN' : '🟢 LIVE'}`);
  logger.schedule(`Timezone: ${timezone}`);
  logger.divider();

function getLocalDateString(date, timeZone = timezone) {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

  // Helper to check and run catch-up
  async function checkCatchUp() {
    try {
      const now = new Date();
      // Count how many windows have passed today in local time
      let windowsPassed = 0;
      for (const w of Object.values(POSTING_WINDOWS)) {
        const windowTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), w.hour, w.minute, 0);
        if (now >= windowTime) windowsPassed++;
      }

      // Check how many posts were actually made today in local timezone
      const { loadHistory } = await import('./queue.js');
      const history = await loadHistory();
      const todayStr = getLocalDateString(now, timezone);
      const postsToday = history.posts.filter(p => p.postedAt && getLocalDateString(p.postedAt, timezone) === todayStr);
      const postedToday = postsToday.length;

      if (postedToday < windowsPassed) {
        // Enforce explicit 30-minute buffer between catch-up posts to protect against spam
        if (postsToday.length > 0) {
          const lastPostTime = new Date(postsToday[postsToday.length - 1].postedAt);
          const minsSinceLastPost = (now - lastPostTime) / (1000 * 60);
          if (minsSinceLastPost < 30) {
            return; // Silently wait for the next interval to respect the 30-minute safety buffer
          }
        }

        logger.warn(`⚠️ Behind schedule! (${postedToday}/${windowsPassed} posts for passed windows). Running catch-up post...`);
        await executePost(dryRun);
      }
    } catch (err) {
      logger.error('Error in catch-up loop:', err);
    }
  }

  // Schedule all posting windows
  for (const [key, window] of Object.entries(POSTING_WINDOWS)) {
    const cronExp = buildCronExpression(window, timezone);
    logger.schedule(`Registered [${window.label}]: ${cronExp.expression}`);
    
    const task = cron.schedule(
      cronExp.expression,
      async () => {
        logger.info(`⏰ Time for scheduled post: ${window.label}`);
        await checkCatchUp(); // checkCatchUp will post if we're behind, which we will be at this exact minute
      },
      { timezone, scheduled: true }
    );
    // Keep reference if we need to stop them later
    if (!scheduledTask) scheduledTask = [];
    scheduledTask.push(task);
  }

  isRunning = true;

  // Responsive Sleep-Mode Check: Check every 5 minutes so it reacts quickly when laptop wakes up
  checkCatchUp();
  const catchUpInterval = setInterval(() => {
    checkCatchUp();
  }, 5 * 60 * 1000); // 5 mins

  // Auto-refill queue when running low
  cron.schedule('0 0 * * *', async () => { // Check daily at midnight
    const q = await loadQueue();
    const p = q.tweets.filter(t => !t.posted).length;
    if (p < GENERATION.refillThreshold) {
      logger.info('Queue running low, auto-generating more content...');
      await fillQueue(GENERATION.batchSize);
    }
  }, { timezone });

  // Show current status
  const status = await getStatus();
  logger.info(`Campaign progress: Day ${status.campaignDay}/${status.totalDays || 100} (${status.progress}%)`);
  logger.info(`Queue: ${status.queuePending} tweets pending`);
  if (status.totalPosted >= 100) {
    logger.success('🎉 100 Days Campaign is 100% Complete! All posts have been successfully published.');
  }
  logger.info('');
  logger.info('Press Ctrl+C to stop the scheduler');

  // Keep the process alive
  process.on('SIGINT', () => {
    stopScheduler();
    process.exit(0);
  });
}

/**
 * Execute a single post from the queue
 */
async function executePost(dryRun = false) {
  logger.divider();
  logger.post(`⏰ Posting time! (${new Date().toLocaleString()})`);

  const tweet = await getNext();
  if (!tweet) {
    logger.warn('No tweets in queue! Generating...');
    await fillQueue(GENERATION.batchSize);
    const newTweet = await getNext();
    if (!newTweet) {
      logger.error('Failed to generate tweets');
      return;
    }
    return executePost(dryRun);
  }

  logger.tweetPreview(tweet.text, tweet.day, tweet.pillarName);

  let result;
  if (tweet.replyLink) {
    // Post with link in reply
    result = await postWithReply(tweet.text, tweet.replyLink.text, tweet.mediaPath, dryRun);
  } else {
    // Standard post
    result = await postTweet(tweet.text, tweet.mediaPath, dryRun);
  }

  if (result.success) {
    await markPosted(tweet.id, result);
    
    const status = await getStatus();
    logger.success(`Day ${tweet.day}/100 posted! (${status.progress}% complete)`);

    // Engagement window alert
    if (ENGAGEMENT_WINDOW.alertEnabled && !dryRun) {
      logger.info('');
      logger.warn(ENGAGEMENT_WINDOW.message);
      logger.info(`Go to https://x.com/AadarshP77 and engage with replies!`);
    }
  } else {
    logger.error(`Failed to post: ${result.error}`);
  }
}

/**
 * Stop the scheduler
 */
export function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
  isRunning = false;
  logger.info('Scheduler stopped');
}

/**
 * Post immediately (next tweet in queue)
 */
export async function postNow(dryRun = false) {
  await executePost(dryRun);
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning() {
  return isRunning;
}

// Timezone support: dynamic fallback to system or environment IANA zone
