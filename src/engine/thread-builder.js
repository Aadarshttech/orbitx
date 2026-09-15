// Thread Builder
// Splits long-form content into threaded tweets

import { trimToLimit, countChars, charDisplay } from '../utils/char-counter.js';
import { CHAR_LIMIT } from '../../config/campaign.js';

/**
 * Build a thread from long-form content
 * @param {string} title - Thread title/hook
 * @param {string[]} points - Array of points for each tweet in the thread
 * @param {object} options - Thread options
 * @returns {object[]} Array of tweet objects for the thread
 */
export function buildThread(title, points, options = {}) {
  const {
    addCounter = true,
    addBookmarkCTA = true,
    hashtags = [],
  } = options;

  const totalTweets = points.length + 1 + (addBookmarkCTA ? 1 : 0); // +1 for title, +1 for CTA
  const tweets = [];

  // First tweet: Hook/title
  let firstTweet = title;
  if (addCounter) {
    firstTweet += `\n\n🧵 Thread (1/${totalTweets})`;
  } else {
    firstTweet += '\n\n🧵 Thread ↓';
  }
  tweets.push({
    index: 0,
    text: trimToLimit(firstTweet),
    charCount: charDisplay(firstTweet),
    isFirst: true,
  });

  // Body tweets
  points.forEach((point, idx) => {
    let tweetText = point;
    if (addCounter) {
      tweetText += `\n\n(${idx + 2}/${totalTweets})`;
    }
    tweets.push({
      index: idx + 1,
      text: trimToLimit(tweetText),
      charCount: charDisplay(tweetText),
      isFirst: false,
    });
  });

  // Final tweet: CTA + hashtags
  if (addBookmarkCTA) {
    let finalTweet = 'If you found this useful:\n\n';
    finalTweet += '→ 🔖 Bookmark this thread\n';
    finalTweet += '→ ♻️ Repost to help others\n';
    finalTweet += '→ Follow @AadarshP77 for more\n';
    if (hashtags.length > 0) {
      finalTweet += `\n${hashtags.join(' ')}`;
    }
    if (addCounter) {
      finalTweet += `\n\n(${totalTweets}/${totalTweets})`;
    }
    tweets.push({
      index: tweets.length,
      text: trimToLimit(finalTweet),
      charCount: charDisplay(finalTweet),
      isFirst: false,
      isCTA: true,
    });
  }

  return tweets;
}

/**
 * Auto-split a long text into a thread
 * @param {string} longText - Text that exceeds 280 chars
 * @returns {object[]} Thread tweets
 */
export function autoSplitThread(longText) {
  if (countChars(longText) <= CHAR_LIMIT) {
    return [{ index: 0, text: longText, isFirst: true }];
  }

  const paragraphs = longText.split('\n\n').filter(p => p.trim());
  const tweets = [];
  let currentTweet = '';

  for (const para of paragraphs) {
    const combined = currentTweet ? `${currentTweet}\n\n${para}` : para;

    if (countChars(combined) <= CHAR_LIMIT - 10) { // Reserve 10 chars for counter
      currentTweet = combined;
    } else {
      if (currentTweet) {
        tweets.push(currentTweet);
      }
      currentTweet = para;
    }
  }
  if (currentTweet) {
    tweets.push(currentTweet);
  }

  // Add counters
  const total = tweets.length;
  return tweets.map((text, idx) => ({
    index: idx,
    text: `${text}\n\n(${idx + 1}/${total})`,
    charCount: charDisplay(`${text}\n\n(${idx + 1}/${total})`),
    isFirst: idx === 0,
  }));
}

/**
 * Pre-built thread templates for common topics
 */
export const THREAD_TEMPLATES = {
  toolReview: {
    title: '🧵 {tool} — Everything you need to know:\n\nI spent {time} testing it.',
    points: [
      'What is {tool}?\n\n{description}',
      'Pros:\n→ {pro_1}\n→ {pro_2}\n→ {pro_3}',
      'Cons:\n→ {con_1}\n→ {con_2}',
      'Who should use it:\n\n{audience}',
      'My verdict: {verdict}\n\n{rating}/10',
    ],
  },
  learningRoadmap: {
    title: '🧵 How to learn {topic} in 2026:\n\nA complete roadmap (no BS).',
    points: [
      'Step 1: {step_1}\n\nTime: {time_1}\n\nWhy: {why_1}',
      'Step 2: {step_2}\n\nTime: {time_2}\n\nWhy: {why_2}',
      'Step 3: {step_3}\n\nTime: {time_3}\n\nWhy: {why_3}',
      'Common mistakes to avoid:\n\n❌ {mistake_1}\n❌ {mistake_2}\n❌ {mistake_3}',
      'Free resources:\n\n📚 {resource_1}\n📚 {resource_2}\n📚 {resource_3}',
    ],
  },
};
