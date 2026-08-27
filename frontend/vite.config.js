import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression(),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-core';
            }
            if (id.includes('react-router-dom') || id.includes('react-router')) {
              return 'react-router';
            }
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'redux-toolkit';
            }
          }
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3600',
        changeOrigin: true,
        secure: false,
      },

      // '/product': {
      //   target: 'http://localhost:3600',
      //   changeOrigin: true,
      //   secure: false,
      // },
    },
  },
})
