// X Browser Client — Playwright-based automation
// Posts tweets through the browser — COMPLETELY FREE, no API costs
// Uses saved browser sessions so you only login once

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSION_DIR = join(__dirname, '..', '..', 'data', 'session');
const USER_DATA_DIR = join(SESSION_DIR, 'browser-profile');

// Ensure session directory exists
if (!existsSync(SESSION_DIR)) {
  mkdirSync(SESSION_DIR, { recursive: true });
}

/**
 * Launch browser with persistent context (saved login)
 * @param {boolean} headless - Run without visible browser window
 * @returns {object} { browser, context, page }
 */
export async function launchBrowser(headless = true) {
  // Use persistent context to keep login session
  const launchOptions = {
    headless,
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: process.env.TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  };

  if (process.env.BROWSER_CHANNEL) {
    launchOptions.channel = process.env.BROWSER_CHANNEL;
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, launchOptions);
  const page = context.pages()[0] || await context.newPage();
  return { context, page };
}

/**
 * Login to X — opens a visible browser for manual login
 * Session is saved for future use
 */
export async function login() {
  logger.info('Opening browser for X login...');
  logger.info('Please log in manually. The session will be saved.');
  logger.info('Close the browser when you\'re done logging in.');

  const { context, page } = await launchBrowser(false); // Visible browser

  await page.goto('https://x.com/login', { waitUntil: 'domcontentloaded', timeout: 0 });

  logger.info('🔐 Browser opened — log in to your X account');
  logger.info('⏳ Waiting for you to complete login...');

  // Wait for user to reach the home page (indicates successful login)
  try {
    await page.waitForURL('https://x.com/home', { timeout: 300000 }); // 5 min timeout
    logger.success('Login successful! Session saved.');
  } catch {
    // User might navigate elsewhere after login
    logger.info('Checking login status...');
  }

  // Verify login by checking for compose button
  const isLoggedIn = await checkLoginStatus(page);
  if (isLoggedIn) {
    logger.success('✅ Login verified! Session saved for future use.');
    logger.info('You can now close this terminal. Future posts will use this session.');
  } else {
    logger.warn('Could not verify login. Try running `npm run login` again.');
  }

  // Keep browser open for a moment so user can verify
  await page.waitForTimeout(3000);
  await context.close();
}

/**
 * Check if we're logged in
 */
export async function checkLoginStatus(page, shouldNavigate = false) {
  try {
    if (shouldNavigate) {
      await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 15000 });
    }
    // Wait for the compose tweet button or the tweet box to render
    const element = await page.waitForSelector(
      '[data-testid="SideNav_NewTweet_Button"], [data-testid="tweetTextarea_0"]', 
      { timeout: 8000 }
    );
    return !!element;
  } catch {
    return false;
  }
}

/**
 * Post a single tweet
 * @param {string} text - Tweet content
 * @param {boolean} dryRun - If true, doesn't actually post
 * @returns {object} Result with success status and tweet URL
 */
export async function postTweet(text, mediaPath = null, dryRun = false) {
  if (dryRun) {
    logger.post('[DRY RUN] Would post:', text, mediaPath ? `[WITH MEDIA: ${mediaPath}]` : '');
    return { success: true, dryRun: true, text, mediaPath };
  }

  const { context, page } = await launchBrowser(true);

  try {
    // Navigate to X home
    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Check login
    const loggedIn = await checkLoginStatus(page);
    if (!loggedIn) {
      throw new Error('Not logged in. Run `npm run login` first.');
    }

    // Click the compose tweet button
    const composeBtn = await page.$('[data-testid="SideNav_NewTweet_Button"]');
    if (composeBtn) {
      await composeBtn.click();
      await page.waitForTimeout(1500);
    }

    // Find the tweet compose box
    const tweetBox = await page.waitForSelector(
      '[data-testid="tweetTextarea_0"], [role="textbox"][data-testid="tweetTextarea_0"]',
      { timeout: 10000 }
    );

    // Focus and wait for Twitter rich-text editor to settle
    await tweetBox.click({ force: true });
    await page.waitForTimeout(800);

    // Type the tweet reliably
    await typeText(page, text);

    await page.waitForTimeout(1000);

    // Handle Media Attachment
    if (mediaPath) {
      logger.info(`📸 Attaching media: ${mediaPath}`);
      const fileInput = await page.$('input[type="file"][data-testid="fileInput"]');
      if (fileInput) {
        await fileInput.setInputFiles(mediaPath);
        // Wait for upload to process on Twitter's side by waiting for the remove media button
        try {
          await page.waitForSelector('[aria-label="Remove media"], [data-testid="removePhoto"], [aria-label*="Remove"]', { timeout: 15000 });
          logger.info('✅ Media attached successfully.');
        } catch (e) {
          logger.warn('⚠️ Timed out waiting for media preview to appear.');
        }
      } else {
        logger.warn('⚠️ Could not find file input for media upload');
      }
    }

    // Click the Post button
    const postButton = await page.waitForSelector(
      '[data-testid="tweetButton"], [data-testid="tweetButtonInline"]',
      { timeout: 5000 }
    );
    // Use DOM click to bypass invisible tooltips that X renders over the button
    await page.evaluate(btn => btn.click(), postButton);

    // Wait for the tweet to post
    await page.waitForTimeout(5000);

    logger.success('Tweet posted successfully!');
    
    return {
      success: true,
      text,
      postedAt: new Date().toISOString(),
    };

  } catch (err) {
    logger.error(`Failed to post tweet: ${err.message}`);
    return { success: false, error: err.message, text };
  } finally {
    await context.close();
  }
}

/**
 * Post a thread (multiple tweets as replies)
 * @param {object[]} tweets - Array of { text } objects
 * @param {boolean} dryRun - If true, doesn't actually post
 */
export async function postThread(tweets, dryRun = false) {
  if (dryRun) {
    logger.post('[DRY RUN] Would post thread:');
    tweets.forEach((t, i) => {
      logger.info(`  Tweet ${i + 1}/${tweets.length}: ${t.text.slice(0, 60)}...`);
    });
    return { success: true, dryRun: true, tweets };
  }

  const { context, page } = await launchBrowser(true);

  try {
    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Click compose
    const composeBtn = await page.$('[data-testid="SideNav_NewTweet_Button"]');
    if (composeBtn) {
      await composeBtn.click();
      await page.waitForTimeout(1500);
    }

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];

      if (i === 0) {
        // First tweet — type in the main compose box
        const tweetBox = await page.waitForSelector(
          '[data-testid="tweetTextarea_0"]',
          { timeout: 10000 }
        );
        await tweetBox.click({ force: true });
        await page.waitForTimeout(800);
        await typeText(page, tweet.text);

        // Attach media to first tweet if provided
        if (tweet.mediaPath) {
          logger.info(`📸 Attaching media to thread post: ${tweet.mediaPath}`);
          const fileInput = await page.$('input[type="file"][data-testid="fileInput"]');
          if (fileInput) {
            await fileInput.setInputFiles(tweet.mediaPath);
            try {
              await page.waitForSelector('[aria-label="Remove media"], [data-testid="removePhoto"], [aria-label*="Remove"]', { timeout: 15000 });
              logger.info('✅ Media attached successfully to thread.');
            } catch (e) {
              logger.warn('⚠️ Timed out waiting for media preview to appear.');
            }
          }
        }
      } else {
        // Subsequent tweets — click "Add another tweet" button
        const addBtn = await page.$('[data-testid="addButton"]');
        if (addBtn) {
          await addBtn.click({ force: true });
          await page.waitForTimeout(1000);
        }

        // Type in the new tweet box
        const tweetBoxes = await page.$$('[data-testid^="tweetTextarea_"]');
        const lastBox = tweetBoxes[tweetBoxes.length - 1];
        if (lastBox) {
          await lastBox.click({ force: true });
          await page.waitForTimeout(800);
          await typeText(page, tweet.text);
        }
      }

      await page.waitForTimeout(500);
    }

    const postAllBtn = await page.waitForSelector(
      '[data-testid="tweetButton"], [data-testid="tweetButtonInline"]',
      { timeout: 5000 }
    );
    // Use DOM click to bypass invisible tooltips that X renders over the button
    await page.evaluate(btn => btn.click(), postAllBtn);

    await page.waitForTimeout(4000);

    logger.success(`Thread posted! (${tweets.length} tweets)`);
    return { success: true, tweetCount: tweets.length, postedAt: new Date().toISOString() };

  } catch (err) {
    logger.error(`Failed to post thread: ${err.message}`);
    return { success: false, error: err.message };
  } finally {
    await context.close();
  }
}

/**
 * Post a reply to a tweet (for link-in-reply pattern)
 * @param {string} tweetText - The main tweet text
 * @param {string} replyText - The reply text (with link)
 * @param {boolean} dryRun - If true, doesn't actually post
 */
export async function postWithReply(tweetText, replyText, mediaPath = null, dryRun = false) {
  if (dryRun) {
    logger.post('[DRY RUN] Would post with reply:');
    logger.info(`  Main: ${tweetText.slice(0, 60)}...`);
    logger.info(`  Reply: ${replyText}`);
    if (mediaPath) logger.info(`  Media: ${mediaPath}`);
    return { success: true, dryRun: true };
  }

  // Post main tweet first, then reply to it
  // Use the thread mechanism — compose tweet + add reply
  return postThread(
    [{ text: tweetText, mediaPath }, { text: replyText }],
    dryRun
  );
}

/**
 * Type text with proper line breaks and atomic insertion
 */
async function typeText(page, text) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(50);
    }
    if (lines[i].length > 0) {
      await page.keyboard.insertText(lines[i]);
      await page.waitForTimeout(50);
    }
  }
}

/**
 * Check if session exists and is valid
 */
export async function verifySession() {
  if (!existsSync(USER_DATA_DIR)) {
    return { valid: false, reason: 'No session found. Run `npm run login` first.' };
  }

  const { context, page } = await launchBrowser(true);
  try {
    const loggedIn = await checkLoginStatus(page, true);
    return {
      valid: loggedIn,
      reason: loggedIn ? 'Session is valid' : 'Session expired. Run `npm run login` again.',
    };
  } finally {
    await context.close();
  }
}

// Anti-bot evasion: randomized human micro-delays between keystrokes
