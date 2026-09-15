// Logger utility — colorful terminal output
import chalk from 'chalk';

const LOG_LEVELS = {
  INFO: { color: 'cyan', prefix: 'ℹ' },
  SUCCESS: { color: 'green', prefix: '✅' },
  WARN: { color: 'yellow', prefix: '⚠️' },
  ERROR: { color: 'red', prefix: '❌' },
  POST: { color: 'blue', prefix: '🐦' },
  CAMPAIGN: { color: 'magenta', prefix: '🎓' },
  SCHEDULE: { color: 'white', prefix: '⏰' },
  TRENDING: { color: 'yellowBright', prefix: '🔥' },
  COST: { color: 'greenBright', prefix: '💰' },
  DEBUG: { color: 'gray', prefix: '🐛' },
  SEARCH: { color: 'blueBright', prefix: '🔍' },
  REPLY: { color: 'magentaBright', prefix: '💬' },
};

function timestamp() {
  return chalk.gray(new Date().toLocaleTimeString());
}

function log(level, message, data = null) {
  const { color, prefix } = LOG_LEVELS[level] || LOG_LEVELS.INFO;
  const colorFn = chalk[color] || chalk.white;
  
  console.log(`${timestamp()} ${prefix} ${colorFn(message)}`);
  if (data) {
    console.log(chalk.gray(typeof data === 'string' ? `   ${data}` : `   ${JSON.stringify(data, null, 2)}`));
  }
}

export const logger = {
  info: (msg, data) => log('INFO', msg, data),
  success: (msg, data) => log('SUCCESS', msg, data),
  warn: (msg, data) => log('WARN', msg, data),
  error: (msg, data) => log('ERROR', msg, data),
  post: (msg, data) => log('POST', msg, data),
  campaign: (msg, data) => log('CAMPAIGN', msg, data),
  schedule: (msg, data) => log('SCHEDULE', msg, data),
  trending: (msg, data) => log('TRENDING', msg, data),
  cost: (msg, data) => log('COST', msg, data),
  debug: (msg, data) => log('DEBUG', msg, data),
  search: (msg, data) => log('SEARCH', msg, data),
  reply: (msg, data) => log('REPLY', msg, data),

  // Special formatted outputs
  banner: () => {
    console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════╗
║         🐦 X AUTOPILOT v1.0              ║
║   100 Days, 100 Posts Campaign Engine     ║
║         @AadarshP77                       ║
╚═══════════════════════════════════════════╝
    `));
  },

  divider: () => {
    console.log(chalk.gray('─'.repeat(50)));
  },

  tweetPreview: (text, day, pillar) => {
    console.log('');
    logger.divider();
    console.log(chalk.cyan.bold(`  📝 Day ${day}/100 — ${pillar}`));
    logger.divider();
    console.log('');
    // Display tweet with proper formatting
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) {
        console.log(chalk.blue(`  ${line}`));
      } else if (line.startsWith('→') || line.startsWith('✅') || line.startsWith('❌')) {
        console.log(chalk.yellow(`  ${line}`));
      } else {
        console.log(chalk.white(`  ${line}`));
      }
    }
    console.log('');
    logger.divider();
  },
};
