import { networkInterfaces } from 'node:os'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function ipDeCasa(): string {
  const encontradas: string[] = []
  for (const lista of Object.values(networkInterfaces())) {
    for (const red of lista ?? []) {
      if (red.internal) continue
      const familia = String(red.family)
      if (familia !== 'IPv4' && familia !== '4') continue
      encontradas.push(red.address)
    }
  }
  return (
    encontradas.find((ip) => ip.startsWith('192.168.')) ??
    encontradas.find((ip) => ip.startsWith('10.')) ??
    ''
  )
}

// https://vite.dev/config/
const proxyTarget = String(process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:3001');

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'red-local',
      configureServer(server) {
        server.middlewares.use('/api/red-local', (req, res, next) => {
          if (req.method !== 'GET') {
            next()
            return
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ip: ipDeCasa() }))
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: proxyTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
