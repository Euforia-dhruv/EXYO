import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'vendor';
          if (id.includes('node_modules/@tanstack')) return 'query';
          if (id.includes('node_modules/hls.js')) return 'video';
          if (id.includes('node_modules/@ffmpeg')) return 'ffmpeg';
        }
      }
    }
  }
})
