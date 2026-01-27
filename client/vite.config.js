import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 3000, // Now preview will also use port 3000
    strictPort: true // Optional: Prevents Vite from automatically picking a different port if 3000 is busy
  },
  build: {
    // This prevents the original folder structure from appearing in Inspect
    sourcemap: false, 
    // Uses 'terser' for better minification (requires: npm install -D terser)
    minify: 'terser', 
    terserOptions: {
      compress: {
        drop_console: true, // Removes console.logs for production
        drop_debugger: true,
      },
    },
  },
})







