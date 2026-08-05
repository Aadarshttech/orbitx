// Campaign configuration
// Defines content pillars, posting ratios, and campaign structure

export const CHAR_LIMIT = 280;

// Content pillars — the 5 types of content we rotate through
export const CONTENT_PILLARS = {
  AI_INSIGHTS: {
    id: 'ai_insights',
    name: '🤖 AI/ML Insights',
    description: 'Trending AI news, model comparisons, tool reviews',
    weight: 3, // Relative frequency weight
    emoji: '🤖',
  },
  DEV_TIPS: {
    id: 'dev_tips',
    name: '💻 Dev Tips',
    description: 'Coding tricks, Python/JS snippets, productivity hacks',
    weight: 3,
    emoji: '💻',
  },
  LEARNING_JOURNEY: {
    id: 'learning_journey',
    name: '🧠 Learning Journey',
    description: 'Day X/100 progress, study notes, TILs',
    weight: 2,
    emoji: '🧠',
  },
  HOT_TAKES: {
    id: 'hot_takes',
    name: '🔥 Hot Takes',
    description: 'Contrarian opinions on tech trends — drives engagement',
    weight: 2,
    emoji: '🔥',
  },
  AMBASSADOR: {
    id: 'ambassador',
    name: '🎓 Ambassador Campaign',
    description: 'Promoting the Microsoft Learn Student Ambassador campaign link',
    weight: 1, // Lower weight — inserted every 4 posts
    emoji: '🎓',
  },
};

// The ratio of value posts to promotional/builder posts.
export const BUILDER_RATIO = {
  valuePosts: 2,  // Number of regular posts before dropping a promo post
  promoPosts: 1,  // Number of promo posts to drop
};

// Campaign metadata
export const CAMPAIGN = {
  name: '100 Days of AI & Tech',
  totalDays: 100,
  handle: 'AadarshP77',
  displayName: 'Aadarsh Pandit',
  bio: 'BTech AI Student @ Kathmandu University | Machine Learning & NLP | Microsoft Learn Student Ambassador',
  website: 'aadarshapandit.com.np',
  buildInPublicTag: '#BuildInPublic',
};

// Content rules
export const CONTENT_RULES = {
  maxChars: CHAR_LIMIT,
  maxHashtags: 2,
  minLineBreaks: 2, // For dwell time
  avoidLinks: true, // Links go in replies, not main tweet
  threadMinTweets: 2,
  threadMaxTweets: 6,
};

// Engagement hooks — opening lines that grab attention
export const HOOKS = [
  'Hot take:',
  'Unpopular opinion:',
  'Most people don\'t know this but',
  'Stop doing this →',
  'The truth about',
  'I spent hours researching',
  'Here\'s what nobody tells you about',
  'This changed everything for me:',
  'Controversial but true:',
  'The biggest mistake I see:',
  'Why is nobody talking about',
  'If you\'re learning AI in 2026,',
  'The #1 thing that helped me:',
  'I was wrong about',
  'This blew my mind:',
  'You don\'t need a PhD to',
  'Simple trick:',
  'Real talk:',
  'Bookmark this →',
  'A thread on',
];

// Call to actions
export const CTAS = [
  'What do you think? 👇',
  'Agree or disagree?',
  'Save this for later 🔖',
  'RT if you agree ♻️',
  'Drop your take below 👇',
  'Who else has experienced this?',
  'Thoughts? 💭',
  'Would you try this?',
  'Follow for more like this',
  'What\'s your experience?',
  'Am I wrong? 🤔',
  'Thread coming soon on this 🧵',
  'Let me know if you want a deep dive',
  'Tag someone who needs this',
];
