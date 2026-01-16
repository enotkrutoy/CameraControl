
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load env vars from .env and process.env (Vercel)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Ensure the API key is injected during build time
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          // Splitting vendor code for better caching on Vercel CDN
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-three': ['three'],
            'vendor-ai': ['@google/genai']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: 3000,
      strictPort: false
    }
  };
});
