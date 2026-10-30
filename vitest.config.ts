import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // backend/ has its own Jest suite (cd backend && npm test)
    exclude: ['**/node_modules/**', 'backend/**'],
  },
});
