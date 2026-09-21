// Dashboard App — fetches data and renders the UI
(function () {
  'use strict';

  // Auto-refresh interval
  const REFRESH_INTERVAL = 30000; // 30 seconds

  async function fetchData(endpoint) {
    try {
      const res = await fetch(`/api/${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Failed to fetch ${endpoint}:`, err);
      return null;
    }
  }

  function setTextContent(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Pad numbers with leading zero for the HUD look
  function padNum(num) {
    return num.toString().padStart(2, '0');
  }

  function animateNumber(id, target, duration = 1000, pad = true) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const diff = target - start;
    if (diff === 0) {
      el.textContent = pad ? padNum(target) : target;
      return;
    }

    const startTime = performance.now();
    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const current = Math.round(start + diff * eased);
      el.textContent = pad ? padNum(current) : current;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function setProgress(percent) {
    const circle = document.getElementById('progressCircle');
    if (!circle) return;
    const circumference = 502; // 2 * Math.PI * 80
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    setTextContent('progressPercent', `${padNum(percent)}%`);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0].replace(/-/g, '.'); // Format like 2026.09.16
  }

  function formatTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toISOString().replace('T', ' ').substring(0, 19) + 'Z';
  }

  function truncate(text, maxLen = 120) {
    if (!text || text.length <= maxLen) return text || '';
    return text.slice(0, maxLen) + '...';
  }

  // Map the backend pillar names to our UI classes
  const PILLAR_MAP = {
    '🤖 AI/ML Insights': { index: 0, raw: 'ai_insights', clean: 'AI/ML_INSIGHTS' },
    '💻 Dev Tips': { index: 1, raw: 'dev_tips', clean: 'DEV_TIPS' },
    '🧠 Learning Journey': { index: 2, raw: 'learning_journey', clean: 'LEARNING_JOURNEY' },
    '🔥 Hot Takes': { index: 3, raw: 'hot_takes', clean: 'HOT_TAKES' },
    '🧠 AI Builder Journey': { index: 4, raw: 'ai_builder', clean: 'AI_BUILDER' },
  };

  function getCleanPillarName(rawName) {
    // If it comes with emoji, map it
    if (PILLAR_MAP[rawName]) return PILLAR_MAP[rawName].clean;
    // Otherwise fallback
    return String(rawName).toUpperCase().replace(/[^A-Z0-9]/g, '_');
  }

  async function updateDashboard() {
    // Fetch all data in parallel
    const [status, analytics, queue, history] = await Promise.all([
      fetchData('status'),
      fetchData('analytics'),
      fetchData('queue'),
      fetchData('history'),
    ]);

    // Update stats
    if (status) {
      animateNumber('campaignDay', status.campaignDay);
      animateNumber('totalPosted', status.totalPosted);
      animateNumber('queuePending', status.queuePending);
      setProgress(status.progress);
      setTextContent('startDate', formatDate(status.startDate));
      setTextContent('lastPosted', formatTime(status.lastPosted));

      const totalDays = status.totalDays || 100;
      setTextContent('campaignTotalDays', `/${totalDays}`);

      if (status.startDate) {
        const start = new Date(status.startDate);
        const endDate = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);
        setTextContent('endDate', formatDate(endDate.toISOString()));
      }

      // Update pillar breakdown
      if (status.pillarBreakdown) {
        updatePillars(status.pillarBreakdown, status.totalPosted);
      }
    }

    if (analytics) {
      animateNumber('streak', analytics.streak || 0);
    }

    // Update queue
    if (queue && queue.pending) {
      renderQueue(queue.pending);
      const queueBadge = document.getElementById('queueBadge');
      if (queueBadge) queueBadge.textContent = `${padNum(queue.total)} PENDING`;
    }

    // Update history
    if (history && history.posts) {
      renderHistory(history.posts.slice(-10).reverse());
    }
  }

  function updatePillars(breakdown, total) {
    const pillarItems = document.querySelectorAll('.vector-item');
    for (const [name, data] of Object.entries(PILLAR_MAP)) {
      if (pillarItems[data.index]) {
        const count = breakdown[name] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const countEl = pillarItems[data.index].querySelector('.vector-count');
        const fillEl = pillarItems[data.index].querySelector('.vector-bar');
        
        if (countEl) animateNumber(null, count, 1000, true, countEl); // Custom animation for element
        
        // Manual simple update for count
        if (countEl) countEl.textContent = padNum(count);
        if (fillEl) fillEl.style.width = `${pct}%`;
      }
    }
  }

  function renderQueue(items) {
    const list = document.getElementById('queueList');
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = `
        <div class="hud-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><path d="M12 12h.01"></path></svg>
          <p>BUFFER EMPTY</p>
          <p class="hud-hint">EXECUTE <span>npm run generate</span> TO REFILL</p>
        </div>`;
      return;
    }

    list.innerHTML = items.map(tweet => `
      <div class="feed-item clickable" data-id="${tweet.id}" data-text="${escapeHtmlForAttr(tweet.text)}">
        <div class="item-day">
          <span class="item-day-num">${padNum(tweet.day)}</span>
        </div>
        <div class="item-content">
          <div class="item-meta-top">VECTOR: ${getCleanPillarName(tweet.pillarName || tweet.pillar)}</div>
          <div class="item-text">${escapeHtml(truncate(tweet.text, 160))}</div>
          ${tweet.mediaPath ? `<div class="item-media"><img src="/api/media?path=${encodeURIComponent(tweet.mediaPath)}" style="max-width:100%; margin-top:10px; border-radius:4px; border: 1px solid var(--accent-1); opacity: 0.8;" /></div>` : ''}
          <div class="item-meta-bottom">
            <span>CHAR_COUNT: ${tweet.charCount || ''}</span>
            ${tweet.replyLink ? '<span class="has-link">ATTACHMENT: URL</span>' : ''}
          </div>
        </div>
      </div>
    `).join('');
    
    // Add click listeners to queue items
    document.querySelectorAll('#queueList .clickable').forEach(item => {
      item.addEventListener('click', () => {
        openEditModal(item.dataset.id, item.dataset.text);
      });
    });
  }

  function renderHistory(items) {
    const list = document.getElementById('historyList');
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = `
        <div class="hud-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          <p>NO TRANSMISSIONS DETECTED</p>
          <p class="hud-hint">EXECUTE <span>npm run post</span> TO INITIATE</p>
        </div>`;
      return;
    }

    list.innerHTML = items.map(post => `
      <div class="feed-item">
        <div class="item-day">
          <span class="item-day-num">${padNum(post.day)}</span>
        </div>
        <div class="item-content">
          <div class="item-meta-top">VECTOR: ${getCleanPillarName(post.pillarName || post.pillar)}</div>
          <div class="item-text">${escapeHtml(truncate(post.text, 160))}</div>
          <div class="item-meta-bottom">
            <span class="posted-success">STATUS: TRANSMITTED</span>
            <span>T: ${formatTime(post.postedAt)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeHtmlForAttr(text) {
    return escapeHtml(text).replace(/"/g, '&quot;');
  }

  // --- Modal Logic ---
  let currentEditingId = null;
  const modal = document.getElementById('editModal');
  const textArea = document.getElementById('editTweetText');

  function openEditModal(id, text) {
    currentEditingId = id;
    textArea.value = text;
    modal.classList.add('active');
  }

  function closeEditModal() {
    modal.classList.remove('active');
    currentEditingId = null;
    textArea.value = '';
  }

  document.getElementById('closeModalBtn')?.addEventListener('click', closeEditModal);
  
  document.getElementById('saveTweetBtn')?.addEventListener('click', async () => {
    if (!currentEditingId) return;
    
    const newText = textArea.value;
    const btn = document.getElementById('saveTweetBtn');
    const origText = btn.textContent;
    btn.textContent = 'COMMITTING...';
    
    try {
      const res = await fetch('/api/tweet/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentEditingId, text: newText })
      });
      if (res.ok) {
        closeEditModal();
        updateDashboard(); // refresh queue
      } else {
        alert('Failed to save tweet');
      }
    } catch (e) {
      alert('Error saving tweet');
    } finally {
      btn.textContent = origText;
    }
  });

  // Initial load
  updateDashboard();

  // Auto-refresh
  setInterval(updateDashboard, REFRESH_INTERVAL);
})();
