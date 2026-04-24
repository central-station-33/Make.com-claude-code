import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from "lovable-tagger";

// When deploying to GitHub Pages the app lives under /<repo-name>/.
// Set VITE_BASE_PATH env var (e.g. /Make.com-claude-code/) in CI to enable this.
// Defaults to '/' for local dev and other hosting targets.
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig(({ mode }) => ({
  base,
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    strictPort: true,
    host: true,
    hmr: {
      clientPort: 443,
      overlay: true,
    },
    watch: {
      usePolling: true,
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
}));
