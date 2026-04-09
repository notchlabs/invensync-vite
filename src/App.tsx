import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import LandingPage from './pages/LandingPage'
import InventoryPage from './pages/panel/InventoryPage'
import AuthGuard from './guards/AuthGuard'
import AppLayout from './layouts/AppLayout'

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-md)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Routes — requires MSAL authentication */}
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/app/panel/inventory" element={<InventoryPage />} />
            {/* Add more protected routes here */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
