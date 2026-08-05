// Character counter utility
// Enforces X's 280-char limit for unverified accounts

import { CHAR_LIMIT } from '../../config/campaign.js';

/**
 * Count characters in a tweet (X counts differently from String.length)
 * - URLs count as 23 chars regardless of length
 * - Emojis count as 2 chars
 * - Everything else is 1 char
 */
export function countChars(text) {
  let count = 0;
  const urlRegex = /https?:\/\/\S+/g;
  const cleaned = text.replace(urlRegex, () => {
    count += 23; // URLs always count as 23
    return '';
  });

  // Count remaining characters (simplified — emojis as 2)
  for (const char of cleaned) {
    const code = char.codePointAt(0);
    if (code > 0xffff) {
      count += 2; // Emoji / supplementary chars
    } else {
      count += 1;
    }
  }
  return count;
}

/**
 * Check if tweet is within character limit
 */
export function isWithinLimit(text, limit = CHAR_LIMIT) {
  return countChars(text) <= limit;
}

/**
 * Trim tweet to fit within character limit
 * Tries to cut at word boundary, preserves hashtags at end
 */
export function trimToLimit(text, limit = CHAR_LIMIT) {
  if (isWithinLimit(text, limit)) return text;

  // Extract trailing hashtags
  const hashtagMatch = text.match(/(\n\n(?:#\w+\s*)+)$/);
  const hashtags = hashtagMatch ? hashtagMatch[1] : '';
  const body = hashtagMatch ? text.slice(0, -hashtags.length) : text;
  const hashtagLen = countChars(hashtags);

  // Available space for body
  const bodyLimit = limit - hashtagLen - 3; // 3 for "..."
  
  let trimmed = '';
  let currentLen = 0;
  
  for (const char of body) {
    const charLen = char.codePointAt(0) > 0xffff ? 2 : 1;
    if (currentLen + charLen > bodyLimit) break;
    trimmed += char;
    currentLen += charLen;
  }

  // Cut at last word boundary
  const lastSpace = trimmed.lastIndexOf(' ');
  const lastNewline = trimmed.lastIndexOf('\n');
  const cutPoint = Math.max(lastSpace, lastNewline);
  if (cutPoint > trimmed.length * 0.7) {
    trimmed = trimmed.slice(0, cutPoint);
  }

  return trimmed.trimEnd() + '...' + hashtags;
}

/**
 * Get character count display string
 */
export function charDisplay(text, limit = CHAR_LIMIT) {
  const count = countChars(text);
  const remaining = limit - count;
  const status = remaining >= 0 ? '✅' : '❌';
  return `${status} ${count}/${limit} (${remaining >= 0 ? remaining + ' remaining' : Math.abs(remaining) + ' over'})`;
}
