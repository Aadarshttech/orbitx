# 🛰️ OrbitX — Autonomous X/Twitter Campaign Engine & Telemetry Console

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Automation-Playwright-orange.svg)](https://playwright.dev/)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()

> **OrbitX** is a free, self-hosted, 24/7 automated campaign engine and cyberpunk HUD telemetry console for X (formerly Twitter). Designed for developers, creators, and engineers executing long-term content strategies without paying prohibitive official API subscription fees.

---

## ⚡ Highlights

- **💸 Zero API Fees:** Employs headless browser automation via Playwright with persistent context sessions.
- **🕒 Intelligent Multi-Window Scheduler:** Native `node-cron` orchestrator with peak engagement window dispatching, catch-up capabilities, and automatic queue refill triggers.
- **🖥️ Cyberpunk HUD Telemetry Dashboard:** Express-backed local web console (`http://localhost:3847`) featuring real-time stats, orbital progress ring, campaign day countdown, queue inspection, and live tweet editing.
- **🧵 Thread & Media Pipeline:** Out-of-the-box support for standalone tweets, image/media uploads, and recursive reply threads.
- **🛡️ Anti-Automation Safeguards:** Humanized typing cadences, variable DOM waits, and persistent browser fingerprinting to minimize detection risks.
- **🔄 Resilient 24/7 Background Daemon:** Auto-restarting runner (`start-background.bat`), silent background runner (`run-silent.vbs`), and Windows startup installer.

---

## 📐 Architecture

```
┌────────────────────────────────────────────────────────┐
│                   ORBITX ENGINE                        │
├─────────────────┬───────────────────┬──────────────────┤
│  CLI & Engine   │     Scheduler     │   HUD Console    │
│  src/index.js   │ src/scheduler/    │ src/dashboard/   │
├─────────────────┼───────────────────┼──────────────────┤
│ - Commander CLI │ - Node-Cron engine│ - Express REST   │
│ - Queue inspect │ - Multi-window    │ - Queue editor   │
│ - Content gen   │ - Catch-up logic  │ - Analytics feed │
└────────┬────────┴─────────┬─────────┴────────┬─────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────────────────────────────────────────────┐
│             PLAYWRIGHT BROWSER CONTROLLER              │
│                 src/twitter/client.js                  │
├────────────────────────────────────────────────────────┤
│ Persistent User-Data Session • Stealth Evasion Args    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
                    🌐 https://x.com
```

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- Git

### 2. Clone & Install

```bash
git clone https://github.com/Aadarshttech/orbitx.git
cd orbitx
npm install
npx playwright install chromium
```

### 3. Environment Setup

```bash
cp .env.example .env
```

Configure your `.env` settings:
```ini
X_HANDLE=your_x_handle
CAMPAIGN_DAYS=100
TIMEZONE=UTC
DASHBOARD_PORT=3847
```

### 4. Interactive Login

Launch an interactive browser session to log in to your X account once. The authenticated session is automatically persisted to local storage for subsequent automated runs:

```bash
npm run login
```

---

## 🕹️ Usage & Commands

| Command | Description |
| :--- | :--- |
| `npm run dashboard` | Starts the orbital HUD telemetry console at `http://localhost:3847` |
| `npm run start` | Boots the 24/7 automated posting scheduler daemon |
| `npm run dry-run` | Runs the scheduler in safe mode (previews actions without posting) |
| `npm run post` | Immediately publishes the next queued tweet |
| `npm run preview` | Previews upcoming posts and pillar metadata in your terminal |
| `npm run status` | Displays campaign progress, day streak, and queue status |
| `npm run generate` | Generates a new batch of scheduled tweets |

---

## 🖥️ Telemetry Dashboard

Navigate to `http://localhost:3847` to access your mission control interface:
- **Orbital Progress Ring:** Visualizes current campaign completion percentage.
- **System Telemetry:** Tracks executed posts, queue buffer depth, and API burn rate ($0.00).
- **Queue Inspector & Editor:** Review pending posts and modify copy directly before publication.
- **Pillar Distribution:** Analytics breakdown across your strategic content pillars.

---

## 🛡️ Best Practices & Disclaimer

> **Notice:** This project is developed for educational and portfolio demonstration purposes. Automated interaction with third-party web platforms must adhere to their respective terms of service. Configure responsible posting cadences, avoid spam behaviors, and use test accounts when experimenting with high-frequency automation.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

<!-- OrbitX v1.0.0 Production Ready -->
