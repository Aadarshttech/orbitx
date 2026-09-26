# Contributing to OrbitX 🛰️

First off, thank you for considering contributing to OrbitX! It's people like you who make open source such a powerful tool for developers.

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

## Code Style
- Keep codebase modular and free of external bloat.
- Ensure all automated browser interactions include humanized intervals to prevent bot detection.
- Maintain clean, descriptive commit messages.
