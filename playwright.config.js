import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3107', channel: 'chrome', headless: true },
  webServer: {
    command: 'node server.js', url: 'http://127.0.0.1:3107', reuseExistingServer: false,
    env: { PORT: '3107', HOST: '127.0.0.1', GEMINI_API_KEY: '' }
  }
});
