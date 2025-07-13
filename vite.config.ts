import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/pages': path.resolve(__dirname, 'src/pages'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/store': path.resolve(__dirname, 'src/store'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/api': path.resolve(__dirname, 'src/api'),
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/test': path.resolve(__dirname, 'src/test'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          flow: ['reactflow'],
          ui: ['lucide-react'],
          state: ['zustand', 'immer'],
          socket: ['socket.io-client'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'reactflow', 'zustand', 'immer'],
  },
  define: {
    // 환경 변수 노출
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
});