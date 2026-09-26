# Contributing to OrbitX 🛰️

First off, thank you for considering contributing to OrbitX! It's people like you who make open source such a powerful tool for developers.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### 1. Reporting Bugs
- Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/Aadarshttech/orbitx/issues).
- If you're unable to find an open issue addressing the problem, open a new one with clear reproduction steps and environment details.

### 2. Suggesting Enhancements
- Open an issue describing the proposed feature or improvement.
- Explain the use case and why it would benefit the community.

### 3. Pull Requests
1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b feature/my-cool-feature
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the automated test suites to ensure everything passes:
   ```bash
   npm run test:char-limit
   npm run test:ratio
   ```
4. Commit your changes and push to your fork.
5. Submit a Pull Request targeting `main`.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/Aadarshttech/orbitx.git
cd orbitx

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Copy environment config
cp .env.example .env

# Start the dashboard in development
npm run dashboard
```

## Project Structure

```
orbitx/
├── src/
│   ├── index.js          # CLI entry point
│   ├── scheduler/        # Cron-based scheduling engine
│   ├── twitter/           # Playwright browser automation
│   ├── dashboard-server.js # Express HUD telemetry server
│   └── tests/            # Test suites
├── config/               # Schedule and pillar configuration
├── dashboard/            # Frontend HUD assets
├── data/                 # Runtime data (logs, queue, sessions)
└── docs/                 # Architecture documentation
```

## Code Style
- Keep codebase modular and free of external bloat.
- Ensure all automated browser interactions include humanized intervals to prevent bot detection.
- Maintain clean, descriptive commit messages.
- Use ES module syntax (`import`/`export`) consistently.

