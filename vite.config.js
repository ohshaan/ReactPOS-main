import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/posapi': {
        target: 'http://117.247.187.131:8087', // Your backend API
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/posapi/, '/posapi'), // optional but good for clarity
      },
    },
  },
})
