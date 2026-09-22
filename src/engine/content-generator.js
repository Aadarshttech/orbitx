// Content Generator — The brain of X Autopilot
// Generates tweets from templates + trending topics + campaign config

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CONTENT_PILLARS, BUILDER_RATIO, HOOKS, CTAS } from '../../config/campaign.js';
import { AMBASSADOR } from '../../config/ambassador.js';
import { selectHashtags, formatHashtags } from './hashtag-optimizer.js';
import { fetchTrending, extractTweetTopic, getEvergreenTopics } from './trending-analyzer.js';
import { trimToLimit, charDisplay, isWithinLimit } from '../utils/char-counter.js';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', '..', 'data', 'templates');

// Template cache
let templateCache = null;

/**
 * Load all tweet templates
 */
async function loadTemplates() {
  if (templateCache) return templateCache;

  const files = {
    ai_insights: 'ai-tweets.json',
    dev_tips: 'tech-tweets.json',
    hot_takes: 'engagement-tweets.json',
    ambassador: 'ambassador-tweets.json',
    learning_journey: 'journey-tweets.json',
  };

  templateCache = {};
  for (const [pillar, file] of Object.entries(files)) {
    try {
      const content = await readFile(join(TEMPLATES_DIR, file), 'utf-8');
      templateCache[pillar] = JSON.parse(content);
    } catch (err) {
      logger.warn(`Failed to load templates for ${pillar}: ${err.message}`);
      templateCache[pillar] = [];
    }
  }
  return templateCache;
}

/**
 * Generate a batch of tweets for N days
 * @param {number} startDay - Campaign day to start from
 * @param {number} count - Number of tweets to generate
 * @returns {Array} Generated tweets
 */
export async function generateBatch(startDay, count = 7) {
  const templates = await loadTemplates();
  let trendingTopics;

  try {
    trendingTopics = await fetchTrending();
    logger.success(`Fetched ${trendingTopics.length} trending topics`);
  } catch (err) {
    logger.warn('Failed to fetch trending topics, using evergreen content');
    trendingTopics = null;
  }

  const evergreenTopics = getEvergreenTopics();
  const tweets = [];
  let builderCounter = 0;

  for (let i = 0; i < count; i++) {
    const day = startDay + i;
    builderCounter++;

    // Decide content pillar
    let pillar;
    if (builderCounter > BUILDER_RATIO.valuePosts) {
      pillar = 'ambassador';
      builderCounter = 0;
    } else {
      // Weighted random selection from value pillars
      pillar = selectValuePillar();
    }

    // Pick a trending topic or evergreen
    const topicData = pickTopic(trendingTopics, evergreenTopics, i);

    // Generate tweet from template
    const tweet = await generateTweet(templates, pillar, day, topicData);
    tweets.push(tweet);
  }

  return tweets;
}

/**
 * Select a value content pillar (weighted random)
 */
function selectValuePillar() {
  const valuePillars = Object.values(CONTENT_PILLARS).filter(
    p => p.id !== 'ambassador'
  );
  
  const totalWeight = valuePillars.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const pillar of valuePillars) {
    random -= pillar.weight;
    if (random <= 0) return pillar.id;
  }
  return valuePillars[0].id;
}

/**
 * Pick a topic from trending or evergreen
 */
function pickTopic(trending, evergreen, index) {
  if (trending && trending.length > 0) {
    const trendIdx = index % trending.length;
    return extractTweetTopic(trending[trendIdx]);
  }
  const evgIdx = index % evergreen.length;
  return evergreen[evgIdx];
}

/**
 * Generate a single tweet from a template
 */
async function generateTweet(templates, pillarId, day, topicData) {
  const pillarTemplates = templates[pillarId] || [];
  if (pillarTemplates.length === 0) {
    logger.warn(`No templates for pillar ${pillarId}, falling back to ai_insights`);
    return generateTweet(templates, 'ai_insights', day, topicData);
  }

  // Pick a random template
  const template = pillarTemplates[Math.floor(Math.random() * pillarTemplates.length)];
  
  // Get hashtags
  const hashtags = selectHashtags(pillarId, topicData.topic || '', pillarId === 'ambassador' ? 1 : 1);

  // Fill template variables
  const filledText = fillTemplate(template.template, {
    day: String(day),
    week: String(Math.ceil(day / 7)),
    topic: topicData.topic || 'AI',
    insight: topicData.insight || topicData.summary || '',
    hashtag: formatHashtags(hashtags),
    hook: HOOKS[Math.floor(Math.random() * HOOKS.length)],
    cta: CTAS[Math.floor(Math.random() * CTAS.length)],
    // Topic-specific fills
    topic_a: topicData.topic || 'GPT-5',
    topic_b: getAlternativeTopic(topicData.topic),
    point_1: 'Better reasoning capability',
    point_2: 'Lower cost per token',
    point_3: 'Faster response times',
    tool: topicData.topic || 'Claude Code',
    description: topicData.insight || 'AI-powered coding assistant',
    why: 'It handles complex multi-file edits like no other tool',
    stat: `${Math.floor(Math.random() * 60 + 40)}% of developers now use AI coding assistants`,
    context: 'This was less than 10% just 2 years ago',
    implication: 'If you\'re not using AI to code, you\'re falling behind',
    problem: 'Traditional approaches are too slow',
    solution: `${topicData.topic || 'AI'} automates the heavy lifting`,
    result: 'Ship 3x faster with half the bugs',
    prediction: `${topicData.topic || 'AI Agents'} will replace 50% of SaaS tools`,
    reason_1: '→ Agents handle multi-step workflows',
    reason_2: '→ Cost is dropping exponentially',
    reason_3: '→ Enterprise adoption is accelerating',
    myth: `${topicData.topic || 'AI'} will replace all developers`,
    reality: 'It\'s making developers 10x more productive',
    explanation: 'The best devs are the ones who learn to use AI as a force multiplier',
    model: 'Claude Opus',
    fast: 'Gemini Flash',
    data: 'Python + pandas',
    cost: '$0/month (free tiers)',
    before: 'Spent 4 hours on boilerplate',
    after: 'Ship a full MVP in 2 hours',
    // Dev tips fills
    lang: ['Python', 'JavaScript', 'TypeScript'][Math.floor(Math.random() * 3)],
    tip: 'Use list comprehensions instead of for loops',
    mistake: 'Not writing tests until the end',
    fix: 'Write tests first. Every time.',
    hack: 'Batch similar tasks together',
    step_1: 'Group similar tasks in your todo',
    step_2: 'Set a 25-min timer (Pomodoro)',
    step_3: 'No context switching until done',
    editor: 'VS Code + Cursor',
    terminal: 'Windows Terminal + zsh',
    ai: 'Claude + GitHub Copilot',
    vcs: 'Git + GitHub',
    deploy: 'Vercel + Azure',
    command: 'git stash --include-untracked',
    when: 'When you need to switch branches mid-work',
    time: `${Math.floor(Math.random() * 3 + 1)} hours`,
    lesson: 'Always check the simple things first',
    long_way: 'manual for loops',
    short_way: 'Array methods (map, filter, reduce)',
    shortcut: 'Ctrl+Shift+P → Command Palette',
    api_name: 'Hacker News API',
    what: 'Access to all HN posts and comments',
    limit: 'No rate limit',
    use_case: 'Build a custom tech news dashboard',
    bad: 'Nested callbacks and magic numbers',
    good: 'Async/await and named constants',
    // Engagement fills
    question: 'What\'s the most overrated tech skill in 2026?',
    my_answer: 'Memorizing syntax. AI handles that now.',
    take: `${topicData.topic || 'AI Agents'} are more important than the models themselves`,
    opinion: 'You don\'t need a CS degree to be a great developer',
    reasoning: 'Skills > credentials. Every time.',
    option_a: 'Master 1 language deeply',
    option_b: 'Learn 5 languages at surface level',
    pick: 'A',
    reason: 'Depth beats breadth in tech careers',
    item_1: 'System Design',
    item_2: 'DSA',
    item_3: 'ML/AI',
    item_4: 'Frontend',
    ranking: '1→3→4→2',
    statement: 'Most coding bootcamps teach outdated skills',
    evidence: 'The industry moves faster than curricula can update',
    confession: 'I sometimes copy code from Stack Overflow without fully understanding it',
    category: 'Programming languages',
    s_tier: 'Python, TypeScript',
    a_tier: 'Rust, Go',
    b_tier: 'Java, C#',
    c_tier: 'PHP, Ruby',
    overrated: 'Blockchain',
    underrated: 'Edge computing',
    // Ambassador fills
    project_1: 'AI-powered CV analyzer',
    project_2: 'NLP chatbot for students',
    project_3: 'Computer vision attendance system',
    benefit_1: 'Access to Microsoft events & mentors',
    benefit_2: 'Free Azure credits & certifications',
    benefit_3: 'A global community of builders',
    tip_1: 'Link each project to a real problem',
    tip_2: 'Include live demos, not just screenshots',
    tip_3: 'Write about what you learned, not just what you built',
    point_1: 'Mentorship from Microsoft engineers',
    point_2: 'Access to beta products & events',
    point_3: 'A network that spans 100+ countries',
    event_name: 'AI Workshop: From Zero to Agent',
    date: 'Coming soon',
    speakers: 'Me + community experts',
    path_name: 'Azure AI Fundamentals',
    difficulty: '⭐⭐ (Beginner-friendly)',
    best_part: 'Hands-on labs with real Azure services',
    verdict: '9/10 — Best free AI course available',
    audience: 'Anyone starting their AI journey',
    // Journey fills
    lesson: 'Start small, iterate fast',
    takeaway: 'Progress > perfection',
    milestone: 'Built my first end-to-end AI pipeline',
    effort_1: 'Hours of debugging',
    effort_2: 'Rewriting code 3 times',
    effort_3: 'But it works now!',
    struggle: 'Couldn\'t get the model to converge.\nTried 5 different approaches.',
    til: `${topicData.topic || 'Transfer learning'} isn\'t as hard as I thought`,
    done: 'Completed data preprocessing',
    in_progress: 'Training the model',
    next: 'Deploy to Azure',
    win: 'Model accuracy hit 95%',
    challenge: 'Data cleaning took forever',
    resource: `${topicData.topic || 'Microsoft Learn'} documentation`,
    idea: `Build a ${topicData.topic || 'sentiment analysis'} app`,
    stack_1: 'Python + FastAPI',
    stack_2: 'Azure AI Services',
    stack_3: 'React frontend',
  });

  // Ensure within character limit
  const finalText = trimToLimit(filledText);

  // Determine if this needs a reply with link
  let replyLink = null;
  if (template.linkId) {
    const link = AMBASSADOR.campaignLinks.find(l => l.id === template.linkId);
    if (link) {
      replyLink = {
        text: `🔗 ${link.description}\n\n${link.url}`,
        url: link.url,
      };
    }
  }

  return {
    id: `day_${day}_${template.id}`,
    day,
    pillar: pillarId,
    pillarName: CONTENT_PILLARS[Object.keys(CONTENT_PILLARS).find(
      k => CONTENT_PILLARS[k].id === pillarId
    )]?.name || pillarId,
    template: template.id,
    text: finalText,
    charCount: charDisplay(finalText),
    replyLink,
    scheduledFor: null,
    posted: false,
    postedAt: null,
    tweetId: null,
    topicSource: topicData.source || 'evergreen',
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Fill a template with variables
 */
function fillTemplate(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }
  return result;
}

/**
 * Get an alternative topic for comparison templates
 */
function getAlternativeTopic(topic) {
  const alternatives = {
    'GPT-5': 'Claude Opus',
    'Claude': 'GPT-5',
    'Gemini': 'Claude',
    'AI Agents': 'Traditional Automation',
    'Python': 'JavaScript',
    'React': 'Vue.js',
    'Azure': 'AWS',
    default: 'Traditional approaches',
  };
  return alternatives[topic] || alternatives.default;
}

/**
 * Generate a single tweet for immediate posting
 */
export async function generateSingle(day, pillarId = null) {
  const pillar = pillarId || selectValuePillar();
  const templates = await loadTemplates();
  const evergreenTopics = getEvergreenTopics();
  const topicData = evergreenTopics[Math.floor(Math.random() * evergreenTopics.length)];
  return generateTweet(templates, pillar, day, topicData);
}

// Content distribution: enforce strict pillar balance across batch intervals
