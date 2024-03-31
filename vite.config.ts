import build from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import postcss from 'postcss'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: ['./src/style.css'],
      output: {
        assetFileNames: 'public/static/[name].[ext]',
      },
    },
  },
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ]
})
