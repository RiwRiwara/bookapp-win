import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    server: {
      proxy: {
        '/s3-proxy': {
          target: 'https://booksiam.s3.ap-southeast-1.amazonaws.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/s3-proxy/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              // Remove origin header to avoid CORS issues
              proxyReq.removeHeader('origin');
            });
          }
        }
      }
    }
  }
})
