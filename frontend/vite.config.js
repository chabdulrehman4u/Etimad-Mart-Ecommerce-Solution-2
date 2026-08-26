import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13'], // Modern browsers only
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    // Only add CSS code splitting for render blocking fix
    cssCodeSplit: true,
    // Enable tree shaking for smaller bundles
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      output: {
        // Enhanced code splitting for better performance
        manualChunks: {
          // Core React (most stable)
          'react-core': ['react', 'react-dom'],
          // Router (loaded on navigation)
          'react-router': ['react-router-dom'],
          // State management (loaded when needed)
          'redux-toolkit': ['@reduxjs/toolkit', 'react-redux'],
          // UI libraries (can be lazy loaded)
          'ui-icons': ['react-icons'],
          'ui-motion': ['framer-motion'],
          'ui-toast': ['react-hot-toast'],
          // Slider (only for components that use it)
          'keen-slider': ['keen-slider'],
          // Utilities (small, can be separate)
          'utils': ['axios', 'react-helmet-async'],
        },
        // Optimize file naming for better caching
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
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
