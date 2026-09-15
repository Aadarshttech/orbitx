// Queue Manager — manages the content pipeline
// Pre-generates content, allows review, tracks posting

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { generateBatch, generateSingle } from '../engine/content-generator.js';
import { charDisplay } from '../utils/char-counter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const QUEUE_FILE = join(DATA_DIR, 'queue.json');
const HISTORY_FILE = join(DATA_DIR, 'history.json');

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Load the current queue
 */
export async function loadQueue() {
  await ensureDataDir();
  try {
    const data = await readFile(QUEUE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { tweets: [], lastGenerated: null, campaignDay: 1 };
  }
}

/**
 * Save the queue
 */
export async function saveQueue(queue) {
  await ensureDataDir();
  await writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');
}

/**
 * Load posting history
 */
export async function loadHistory() {
  await ensureDataDir();
  try {
    const data = await readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { posts: [], totalPosted: 0, startDate: null };
  }
}

/**
 * Save posting history
 */
export async function saveHistory(history) {
  await ensureDataDir();
  await writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
}

/**
 * Generate content and add to queue
 * @param {number} count - Number of tweets to generate
 */
export async function fillQueue(count = 7) {
  const queue = await loadQueue();
  const history = await loadHistory();

  // Calculate current campaign day
  const pendingCount = queue.tweets.filter(t => !t.posted).length;
  const currentDay = history.totalPosted + pendingCount + 1;

  logger.info(`Generating ${count} tweets starting from Day ${currentDay}...`);

  const newTweets = await generateBatch(currentDay, count);

  queue.tweets.push(...newTweets);
  queue.lastGenerated = new Date().toISOString();
  queue.campaignDay = currentDay + count - 1;

  await saveQueue(queue);
  logger.success(`Added ${newTweets.length} tweets to queue (${queue.tweets.filter(t => !t.posted).length} pending)`);

  return newTweets;
}

/**
 * Get the next tweet to post
 */
export async function getNext() {
  const queue = await loadQueue();
  const next = queue.tweets.find(t => !t.posted);
  return next || null;
}

/**
 * Mark a tweet as posted
 */
export async function markPosted(tweetId, result = {}) {
  const queue = await loadQueue();
  const history = await loadHistory();

  const tweet = queue.tweets.find(t => t.id === tweetId);
  if (tweet) {
    tweet.posted = true;
    tweet.postedAt = new Date().toISOString();
    tweet.tweetId = result.tweetId || null;

    // Add to history
    history.posts.push({
      ...tweet,
      result,
    });
    history.totalPosted = history.posts.length;
    if (!history.startDate) {
      history.startDate = new Date().toISOString();
    }

    await saveQueue(queue);
    await saveHistory(history);
  }
}

/**
 * Preview upcoming tweets
 */
export async function preview(count = 5) {
  const queue = await loadQueue();
  const pending = queue.tweets.filter(t => !t.posted);

  if (pending.length === 0) {
    logger.warn('Queue is empty! Run `npm run generate` to fill it.');
    return [];
  }

  const toShow = pending.slice(0, count);
  logger.info(`📋 Next ${toShow.length} tweets in queue:\n`);

  for (const tweet of toShow) {
    logger.tweetPreview(tweet.text, tweet.day, tweet.pillarName);
    console.log(`   ${tweet.charCount}`);
    if (tweet.replyLink) {
      console.log(`   📎 Reply link: ${tweet.replyLink.url}`);
    }
    console.log('');
  }

  return toShow;
}

/**
 * Edit a tweet in the queue
 */
export async function editTweet(tweetId, newText) {
  const queue = await loadQueue();
  const tweet = queue.tweets.find(t => t.id === tweetId);
  
  if (!tweet) {
    logger.error(`Tweet not found: ${tweetId}`);
    return null;
  }

  tweet.text = newText;
  tweet.charCount = charDisplay(newText);
  tweet.editedAt = new Date().toISOString();

  await saveQueue(queue);
  logger.success(`Tweet ${tweetId} updated`);
  return tweet;
}

/**
 * Remove a tweet from the queue
 */
export async function removeTweet(tweetId) {
  const queue = await loadQueue();
  queue.tweets = queue.tweets.filter(t => t.id !== tweetId);
  await saveQueue(queue);
  logger.success(`Tweet ${tweetId} removed from queue`);
}

/**
 * Get campaign status
 */
export async function getStatus() {
  const queue = await loadQueue();
  const history = await loadHistory();

  const pending = queue.tweets.filter(t => !t.posted).length;
  const posted = history.totalPosted;
  const total = 100;
  const progress = Math.round((posted / total) * 100);

  // Content pillar breakdown
  const pillarCounts = {};
  for (const post of history.posts) {
    pillarCounts[post.pillarName] = (pillarCounts[post.pillarName] || 0) + 1;
  }

  return {
    campaignDay: posted + 1,
    totalPosted: posted,
    totalDays: total,
    progress,
    queuePending: pending,
    startDate: history.startDate,
    pillarBreakdown: pillarCounts,
    lastPosted: history.posts.length > 0 ? history.posts[history.posts.length - 1].postedAt : null,
  };
}
