// Trending topic analyzer
// Fetches trending tech/AI topics from free sources

import RSSParser from 'rss-parser';
import { logger } from '../utils/logger.js';

const parser = new RSSParser();

// Free trend sources
const SOURCES = {
  hackerNews: {
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage?count=20',
    type: 'rss',
    weight: 3,
  },
  devTo: {
    name: 'Dev.to',
    url: 'https://dev.to/feed/tag/ai',
    type: 'rss',
    weight: 2,
  },
  devToML: {
    name: 'Dev.to ML',
    url: 'https://dev.to/feed/tag/machinelearning',
    type: 'rss',
    weight: 2,
  },
  redditAI: {
    name: 'Reddit AI',
    url: 'https://www.reddit.com/r/artificial/hot.json?limit=15',
    type: 'reddit',
    weight: 2,
  },
  techCrunchAI: {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    type: 'rss',
    weight: 2,
  },
  theVerge: {
    name: 'The Verge AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    type: 'rss',
    weight: 1,
  },
};

// AI/Tech topic categories for content matching
const TOPIC_CATEGORIES = [
  'ai agents', 'llm', 'gpt', 'claude', 'gemini', 'machine learning',
  'deep learning', 'nlp', 'computer vision', 'transformer', 'neural network',
  'python', 'javascript', 'react', 'next.js', 'node.js', 'typescript',
  'azure', 'aws', 'cloud', 'kubernetes', 'docker', 'devops',
  'open source', 'startup', 'developer tools', 'coding', 'programming',
  'robotics', 'automation', 'data science', 'model training', 'fine-tuning',
  'rag', 'vector database', 'embeddings', 'prompt engineering', 'agentic',
];

/**
 * Fetch trending topics from all sources
 */
export async function fetchTrending() {
  const allTopics = [];
  
  for (const [key, source] of Object.entries(SOURCES)) {
    try {
      let topics;
      if (source.type === 'rss') {
        topics = await fetchRSS(source);
      } else if (source.type === 'reddit') {
        topics = await fetchReddit(source);
      }
      
      if (topics && topics.length > 0) {
        allTopics.push(...topics.map(t => ({ ...t, source: source.name, weight: source.weight })));
        logger.trending(`Fetched ${topics.length} topics from ${source.name}`);
      }
    } catch (err) {
      logger.warn(`Failed to fetch from ${source.name}: ${err.message}`);
    }
  }

  // Score and deduplicate
  const scored = scoreTrendingTopics(allTopics);
  return scored.slice(0, 20); // Top 20 trending topics
}

/**
 * Fetch from RSS feed
 */
async function fetchRSS(source) {
  const feed = await parser.parseURL(source.url);
  return feed.items.map(item => ({
    title: item.title || '',
    summary: item.contentSnippet?.slice(0, 200) || '',
    link: item.link || '',
    date: item.pubDate || new Date().toISOString(),
    categories: item.categories || [],
  }));
}

/**
 * Fetch from Reddit JSON API
 */
async function fetchReddit(source) {
  const response = await fetch(source.url, {
    headers: { 'User-Agent': 'XAutopilot/1.0' },
  });
  const data = await response.json();
  
  return data.data.children
    .filter(post => !post.data.stickied)
    .map(post => ({
      title: post.data.title,
      summary: post.data.selftext?.slice(0, 200) || '',
      link: `https://reddit.com${post.data.permalink}`,
      date: new Date(post.data.created_utc * 1000).toISOString(),
      score: post.data.score,
      categories: [],
    }));
}

/**
 * Score topics by relevance and recency
 */
function scoreTrendingTopics(topics) {
  const scored = topics.map(topic => {
    let score = topic.weight || 1;
    
    // Boost for matching our target categories
    const titleLower = topic.title.toLowerCase();
    const matchedCategories = TOPIC_CATEGORIES.filter(cat => 
      titleLower.includes(cat)
    );
    score += matchedCategories.length * 2;

    // Recency boost (last 24h = full score, decays after)
    const age = Date.now() - new Date(topic.date).getTime();
    const hoursOld = age / (1000 * 60 * 60);
    if (hoursOld < 6) score += 5;
    else if (hoursOld < 24) score += 3;
    else if (hoursOld < 48) score += 1;

    // Reddit score boost
    if (topic.score) {
      score += Math.min(topic.score / 100, 5);
    }

    return { ...topic, relevanceScore: score, matchedCategories };
  });

  // Sort by score descending and deduplicate similar titles
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return deduplicateTopics(scored);
}

/**
 * Remove duplicate/similar topics
 */
function deduplicateTopics(topics) {
  const seen = new Set();
  return topics.filter(topic => {
    // Create a simplified key from significant words
    const key = topic.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 4)
      .sort()
      .join('_');
    
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Extract a tweetable topic from trending data
 */
export function extractTweetTopic(trendingItem) {
  let shortTopic = trendingItem.title;
  
  if (shortTopic.length > 30) {
    if (trendingItem.matchedCategories && trendingItem.matchedCategories.length > 0) {
      const cat = trendingItem.matchedCategories[0];
      shortTopic = cat.charAt(0).toUpperCase() + cat.slice(1);
    } else {
      const words = shortTopic.split(' ');
      if (words.length > 4) {
        shortTopic = words.slice(0, 4).join(' ');
      }
    }
  }

  return {
    topic: shortTopic,
    summary: trendingItem.summary,
    categories: trendingItem.matchedCategories || [],
    source: trendingItem.source,
    score: trendingItem.relevanceScore,
  };
}

/**
 * Get curated evergreen topics (fallback when trending fetch fails)
 */
export function getEvergreenTopics() {
  return [
    { topic: 'AI Agents', insight: 'The future of work is autonomous agents handling multi-step workflows' },
    { topic: 'Model Routing', insight: 'Smart companies route tasks across GPT, Claude, and Gemini to cut costs 40%' },
    { topic: 'RAG Pipelines', insight: 'Retrieval-augmented generation is how you make LLMs actually useful' },
    { topic: 'Prompt Engineering', insight: 'The skill gap isn\'t coding anymore — it\'s knowing how to talk to AI' },
    { topic: 'Azure AI Services', insight: 'Microsoft\'s AI stack is quietly becoming the enterprise standard' },
    { topic: 'Open Source LLMs', insight: 'Open-weight models are closing the gap with GPT faster than expected' },
    { topic: 'Vector Databases', insight: 'Every AI app needs a vector DB — Pinecone, Weaviate, or Chroma' },
    { topic: 'AI Coding Assistants', insight: 'Cursor, Claude Code, and GitHub Copilot are changing how we write code' },
    { topic: 'Fine-tuning', insight: 'Fine-tuning a small model often beats prompting a large one' },
    { topic: 'Computer Vision', insight: 'Real-time object detection is now possible on a Raspberry Pi' },
    { topic: 'NLP Transformers', insight: 'Transformers went from research papers to production in record time' },
    { topic: 'MLOps', insight: 'Building the model is 10% of the work — deploying it is the other 90%' },
    { topic: 'Edge AI', insight: 'Running AI models on-device is the next big shift' },
    { topic: 'AI Ethics', insight: 'Bias in AI isn\'t a future problem — it\'s happening right now' },
    { topic: 'Multimodal AI', insight: 'Models that see, hear, and read are becoming the norm' },
    { topic: 'Python Performance', insight: 'Python is slow but it doesn\'t matter when your bottleneck is the GPU' },
    { topic: 'API Design', insight: 'A well-designed API saves more engineering hours than any framework' },
    { topic: 'Cloud Cost Optimization', insight: 'Most startups overspend on cloud by 40-60%' },
    { topic: 'Developer Experience', insight: 'DX is the new UX — tools that feel good win' },
    { topic: 'Tech Interviews', insight: 'The best engineers I know failed multiple interviews before landing their role' },
  ];
}

// Resilience: resilient fallback if external RSS feeds encounter timeouts
