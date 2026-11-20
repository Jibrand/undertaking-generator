import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Al-Marium Undertaking Generator',
        short_name: 'Undertakings',
        start_url: './',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#f1f6fb',
        icons: [192, 512].map(size => ({
          src: `icon-${size}.png`,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'any maskable',
        })),
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webmanifest}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
})

