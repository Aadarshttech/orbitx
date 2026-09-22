// Campaign pillar balance & ratio test
import { CONTENT_PILLARS } from '../../config/campaign.js';

console.log('🧪 Running Campaign Ratio Tests...\n');

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

// Test 1: Pillars exist
const pillars = Object.values(CONTENT_PILLARS);
assert(pillars.length === 5, '5 campaign content pillars are configured');

// Test 2: Weights exist and are positive
const totalWeight = pillars.reduce((sum, p) => sum + (p.weight || 0), 0);
assert(totalWeight > 0, `Total weight is positive (sum: ${totalWeight})`);

// Test 3: Each pillar has required metadata
const allValid = pillars.every(p => p.id && p.name && p.weight && p.emoji);
assert(allValid, 'All pillars define id, name, emoji, and weight');

console.log(`\n📊 Results: ${passed}/${total} tests passed.`);
if (passed !== total) {
  process.exit(1);
}
