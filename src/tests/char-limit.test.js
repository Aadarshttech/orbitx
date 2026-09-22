// Character limit validation test
import { countChars, isWithinLimit, trimToLimit } from '../utils/char-counter.js';

console.log('🧪 Running Character Limit Tests...\n');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// Test 1: Simple string
assert(countChars('Hello World') === 11, 'Counts standard ASCII characters correctly');

// Test 2: URL counting (X counts any URL as 23 characters)
assert(countChars('Check this: https://example.com/very/long/url/that/exceeds/length') === 12 + 23, 'Normalizes URLs to 23 chars');

// Test 3: Emoji counting (X counts emojis as 2 chars)
assert(countChars('🚀') === 2, 'Counts emoji as 2 characters');

// Test 4: Within limit
assert(isWithinLimit('A short tweet') === true, 'Identifies short tweet as within limit');
assert(isWithinLimit('A'.repeat(281)) === false, 'Identifies tweet over 280 chars as exceeding limit');

// Test 5: Trim to limit
const longTweet = 'A'.repeat(270) + ' and some extra words that will get cut off #orbitx';
const trimmed = trimToLimit(longTweet, 280);
assert(countChars(trimmed) <= 280, 'Trims long tweet to fit within 280 characters');

console.log(`\n📊 Results: ${passed}/${total} tests passed.`);
if (passed !== total) {
  process.exit(1);
}
