# OrbitX Architecture & Design

This document outlines the core architectural components of OrbitX.

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

## Modules

1. **Scheduler**: Handles node-cron cron expressions, posting windows, and catch-up jobs.
2. **Queue Manager**: Stores JSON records of pending and historical tweets with atomic file writes.
3. **Browser Automation**: Uses Playwright with persistent context, stealth anti-automation arguments, and variable keystroke cadence.
4. **HUD Dashboard**: Cyberpunk telemetry interface serving real-time analytics on port 3847.
