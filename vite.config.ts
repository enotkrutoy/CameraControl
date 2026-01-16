
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Import process to resolve TypeScript error for process.cwd() in config context
import process from 'node:process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
