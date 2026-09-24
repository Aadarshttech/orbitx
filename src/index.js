// X Autopilot — Main CLI Entry Point
import { Command } from 'commander';
import { logger } from './utils/logger.js';
import { startScheduler } from './scheduler/cron.js';
import { loadQueue, getStatus, getNext, markPosted, fillQueue } from './scheduler/queue.js';
import { postTweet, postWithReply, login } from './twitter/client.js';

// Global crash guards — prevent daemon from crashing on transient network or browser blips
process.on('uncaughtException', (err) => {
  logger.error(`[Guard] Uncaught exception (recovered): ${err.message}`);
});
process.on('unhandledRejection', (reason) => {
  const msg = reason && reason.message ? reason.message : String(reason);
  logger.warn(`[Guard] Handled async rejection: ${msg}`);
});

const program = new Command();

program
  .name('orbitx')
  .description('🚀 OrbitX — Automated Campaign Engine & Telemetry Console')
  .version('1.0.0');

// Start scheduler command
program
  .command('start')
  .description('Start the automated posting scheduler')
  .option('--dry-run', 'Run scheduler in dry-run mode (no actual posts)')
  .action(async (opts) => {
    await startScheduler(opts.dryRun || false);
  });

// Single manual post command
program
  .command('post')
  .description('Post the next tweet in the queue immediately')
  .option('--dry-run', 'Preview post without publishing')
  .action(async (opts) => {
    logger.banner('Manual Post');
    const tweet = await getNext();
    if (!tweet) {
      logger.warn('No pending tweets in queue!');
      return;
    }

    logger.tweetPreview(tweet.text, tweet.day, tweet.pillarName);
    let result;
    if (tweet.replyLink) {
      result = await postWithReply(tweet.text, tweet.replyLink.text, tweet.mediaPath, opts.dryRun || false);
    } else {
      result = await postTweet(tweet.text, tweet.mediaPath, opts.dryRun || false);
    }

    if (result.success && !opts.dryRun) {
      await markPosted(tweet.id, result);
      logger.success(`Day ${tweet.day} successfully posted to X!`);
    } else if (result.success && opts.dryRun) {
      logger.info('Dry run successful.');
    } else {
      logger.error(`Post failed: ${result.error}`);
    }
  });

// Status command
program
  .command('status')
  .description('Show queue and campaign status')
  .action(async () => {
    const status = await getStatus();
    logger.banner('Campaign Status');
    logger.info(`Campaign Day: ${status.campaignDay}/${status.totalDays || 100}`);
    logger.info(`Progress: ${status.progress}%`);
    logger.info(`Total Posted: ${status.totalPosted}`);
    logger.info(`Queue Pending: ${status.queuePending}`);
  });

// Preview command
program
  .command('preview')
  .description('Preview pending tweets in queue')
  .action(async () => {
    const queue = await loadQueue();
    const pending = queue.tweets.filter(t => !t.posted);
    logger.banner(`Queue Preview (${pending.length} pending)`);
    pending.slice(0, 5).forEach((t, i) => {
      logger.info(`\n[${i + 1}] Day ${t.day} — ${t.pillarName}`);
      logger.info(t.text);
      if (t.mediaPath) logger.info(`Media: ${t.mediaPath}`);
    });
  });

// Login command
program
  .command('login')
  .description('Open browser for interactive login')
  .action(async () => {
    await login();
  });

program.parse(process.argv);

// Campaign metrics: accurate 100-day denominator formatting

// Process protection: guard against unhandled rejections during background runs
