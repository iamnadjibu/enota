import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  resolve: {
    alias: { '@shared': path.resolve(__dirname, '../shared') },
    // Files in ../shared must use this app's copy of these packages.
    dedupe: ['react', 'react-dom', 'framer-motion', 'lucide-react', 'firebase', 'jspdf', 'jspdf-autotable', 'qrcode'],
  },
  server: { fs: { allow: ['..'] } },
  build: { outDir: 'dist' },
})
