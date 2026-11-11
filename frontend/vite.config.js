import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Prompts user and triggers offline ready / update hooks
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'SerbisYou - Service Marketplace',
        short_name: 'SerbisYou',
        description: 'On-demand Service Marketplace connecting Requestors with skilled local Providers',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#0d6efd',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          // 1. Service Listings & Categories (StaleWhileRevalidate for offline browsing)
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('/rest/v1/services') ||
              url.pathname.includes('/api/services'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'services-cache',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              }
            }
          },
          // 2. User Profiles & Providers (NetworkFirst with cached fallback)
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('/rest/v1/users') ||
              url.pathname.includes('/api/users'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'users-cache',
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 12 * 60 * 60 // 12 hours
              }
            }
          },
          // 3. Service Proof Pictures & Storage Media (CacheFirst for fast offline access)
          {
            urlPattern: ({ url, request }) =>
              request.destination === 'image' ||
              url.pathname.includes('/storage/v1/object/public') ||
              /\.(?:png|jpg|jpeg|svg|webp|gif)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'marketplace-media-cache',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          // 4. External CDNs, Icons, and Fonts
          {
            urlPattern: ({ url }) =>
              url.origin.includes('fonts.googleapis.com') ||
              url.origin.includes('fonts.gstatic.com') ||
              url.origin.includes('cdn.jsdelivr.net'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cdn-assets-cache',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
              }
            }
          },
          // 5. Critical Financial & Messaging Transactions (NetworkOnly)
          // Prevents stale QR codes, booking fee calculations, commission fee updates, or chat desync
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('/rest/v1/transactions') ||
              url.pathname.includes('/rest/v1/messages') ||
              url.pathname.includes('/api/transactions') ||
              url.pathname.includes('/api/messages'),
            handler: 'NetworkOnly'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ]
})
