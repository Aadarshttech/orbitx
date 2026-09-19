// Hashtag optimizer
// Smart 1-2 hashtag selection following X best practices

// Hashtag pools organized by content pillar
const HASHTAG_POOLS = {
  ai_insights: [
    '#AI', '#MachineLearning', '#ArtificialIntelligence', '#DeepLearning',
    '#NLP', '#AIAgents', '#GenerativeAI', '#LLM', '#TechTwitter',
    '#DataScience', '#ComputerVision', '#OpenAI', '#MLOps',
  ],
  dev_tips: [
    '#DevTips', '#Programming', '#CodeNewbie', '#100DaysOfCode',
    '#WebDev', '#Python', '#JavaScript', '#CodingTips', '#TechTwitter',
    '#SoftwareEngineering', '#DevOps', '#OpenSource', '#GitHub',
  ],
  learning_journey: [
    '#100DaysOfAI', '#BuildInPublic', '#LearnInPublic', '#StudentDev',
    '#TechJourney', '#LearningToCode', '#100DaysOfCode', '#DevJourney',
  ],
  hot_takes: [
    '#TechTwitter', '#Tech', '#AI', '#HotTake', '#DevCommunity',
    '#Startup', '#Programming', '#SoftwareDev',
  ],
  ambassador: [
    '#MicrosoftLearn', '#MLSA', '#Azure', '#StudentAmbassador',
    '#LearnWithMicrosoft', '#MicrosoftAI', '#AzureAI',
  ],
};

// Track recently used hashtags to avoid repetition
let recentlyUsed = [];
const MAX_RECENT_HISTORY = 10;

/**
 * Select optimal hashtags for a tweet
 * @param {string} pillar - Content pillar ID
 * @param {string} tweetText - The tweet content (for context matching)
 * @param {number} count - Number of hashtags (1 or 2)
 * @returns {string[]} Selected hashtags
 */
export function selectHashtags(pillar, tweetText = '', count = 1) {
  const pool = HASHTAG_POOLS[pillar] || HASHTAG_POOLS.ai_insights;
  
  // Filter out recently used
  const available = pool.filter(h => !recentlyUsed.includes(h));
  const source = available.length >= count ? available : pool;

  // Score hashtags by relevance to tweet content
  const scored = source.map(hashtag => {
    let score = Math.random() * 2; // Base randomness
    const tag = hashtag.toLowerCase().replace('#', '');
    
    // Boost if hashtag topic appears in tweet
    if (tweetText.toLowerCase().includes(tag)) {
      score += 5;
    }
    
    // Boost niche tags over generic ones
    if (['#TechTwitter', '#AI', '#Tech'].includes(hashtag)) {
      score -= 1; // Slightly penalize very generic tags
    }
    
    return { hashtag, score };
  });

  scored.sort((a, b) => b.score - a.score);
  
  const selected = scored.slice(0, count).map(s => s.hashtag);
  
  // Track usage
  recentlyUsed.push(...selected);
  if (recentlyUsed.length > MAX_RECENT_HISTORY) {
    recentlyUsed = recentlyUsed.slice(-MAX_RECENT_HISTORY);
  }

  return selected;
}

/**
 * Format hashtags as a string for tweet insertion
 */
export function formatHashtags(hashtags) {
  return hashtags.join(' ');
}

/**
 * Reset recent usage tracking (for testing)
 */
export function resetHashtagHistory() {
  recentlyUsed = [];
}
