import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    // Raise warning threshold — MSAL is inherently large
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime — always needed, cache forever
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react'
          }
          // Router — needed on every page
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/@remix-run/')) {
            return 'vendor-router'
          }
          // MSAL — only needed for /app routes (lazy loaded)
          if (id.includes('node_modules/@azure/msal-browser') || id.includes('node_modules/@azure/msal-react')) {
            return 'vendor-msal'
          }
          // Icons — large, shared across landing + panel
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons'
          }
          // Animations — used in landing page sections
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-animation'
          }
          // Misc UI utilities
          if (id.includes('node_modules/react-hot-toast') || id.includes('node_modules/react-loading-skeleton')) {
            return 'vendor-ui'
          }
          // Landing page mocks — split into own chunk (lazy loaded)
          if (id.includes('/src/components/mocks/')) {
            return 'landing-mocks'
          }
          // Panel pages — split into own chunk (lazy loaded)
          if (id.includes('/src/pages/panel/')) {
            return 'panel-pages'
          }
        },
      },
    },
  },
})
