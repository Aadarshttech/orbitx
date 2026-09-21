// Dashboard Server — serves the campaign telemetry and queue dashboard
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAnalyticsData } from './analytics/tracker.js';
import { getStatus, loadQueue, loadHistory } from './scheduler/queue.js';
import { logger } from './utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function startDashboard(port = 3847) {
  const app = express();
  const dashboardDir = join(__dirname, '..', 'dashboard');

  // Serve static files
  app.use(express.static(dashboardDir));
  app.use(express.json());

  // ===== CAMPAIGN API ENDPOINTS =====
  app.get('/api/status', async (req, res) => {
    try {
      const status = await getStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/analytics', async (req, res) => {
    try {
      const analytics = await getAnalyticsData();
      res.json(analytics);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/queue', async (req, res) => {
    try {
      const queue = await loadQueue();
      const pending = queue.tweets.filter(t => !t.posted);
      res.json({ pending, total: pending.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/history', async (req, res) => {
    try {
      const history = await loadHistory();
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/media', (req, res) => {
    if (!req.query.path) return res.status(400).send('Missing path');
    res.sendFile(req.query.path);
  });

  app.post('/api/tweet/edit', async (req, res) => {
    const { id, text } = req.body;
    try {
      const { editTweet } = await import('./scheduler/queue.js');
      const success = await editTweet(id, text);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: 'Tweet not found' });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Start server
  app.listen(port, () => {
    logger.success(`Dashboard running at http://localhost:${port}`);
    logger.info('Press Ctrl+C to stop');
  });
}

// Auto-start when run directly
startDashboard().catch(err => {
  console.error('❌ Failed to start dashboard:', err);
  process.exit(1);
});