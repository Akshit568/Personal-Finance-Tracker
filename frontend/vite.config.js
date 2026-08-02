import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies /api to the backend so the SPA and API share an origin
// during development (avoids CORS entirely). Configure the target via VITE_API_URL.
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    build: {
      // Split heavy vendors into their own chunks for better caching/loading.
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'charts': ['recharts'],
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
