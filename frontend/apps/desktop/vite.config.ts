import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@nself-chat/core': path.resolve(__dirname, '../../packages/core/src'),
      '@nself-chat/api': path.resolve(__dirname, '../../packages/api/src'),
      '@nself-chat/state': path.resolve(__dirname, '../../packages/state/src'),
      '@nself-chat/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@nself-chat/config': path.resolve(__dirname, '../../packages/config/src'),
    },
  },
  server: {
    port: 5174,
    strictPort: false,
  },
})
