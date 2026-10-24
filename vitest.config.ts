import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // The backend has its own Jest suite (cd backend && npm test)
    exclude: ['**/node_modules/**', '**/dist/**', 'backend/**'],
    // Run tests in demo mode even if .env.local points at a backend.
    // Tests that cover the real-backend path stub VITE_API_BASE_URL themselves.
    env: { VITE_API_BASE_URL: '' },
  },
});
