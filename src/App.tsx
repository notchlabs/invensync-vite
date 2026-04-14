import './App.css'
import 'react-loading-skeleton/dist/skeleton.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { SkeletonTheme } from 'react-loading-skeleton'

import LandingPage from './pages/LandingPage'
import InventoryPage from './pages/panel/InventoryPage'
import AuthGuard from './guards/AuthGuard'
import AppLayout from './layouts/AppLayout'
import DailyConsumptionPage from './pages/panel/DailyConsumptionPage'
import AddStockPage from './pages/panel/AddStockPage'
import BillsPage from './pages/panel/BillsPage'
import SitesPage from './pages/panel/SitesPage'
import SiteFormPage from './pages/panel/SiteFormPage'
import SiteDetailPage from './pages/panel/SiteDetailPage'
import SiteConsumptionPage from './pages/panel/SiteConsumptionPage'
import VendorsPage from './pages/panel/VendorsPage'
import VendorDetailPage from './pages/panel/VendorDetailPage'
import TransitPage from './pages/panel/TransitPage'
import DashboardPage from './pages/panel/DashboardPage'
import DashboardMonthPage from './pages/panel/DashboardMonthPage'
import ConsumptionPage from './pages/panel/ConsumptionPage'
import ConsumptionLogsPage from './pages/panel/ConsumptionLogsPage'

function App() {
  return (
    <BrowserRouter>
      <SkeletonTheme 
        baseColor="var(--bg-secondary)" 
        highlightColor="var(--bg-app)"
      >
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
            <Route path="/app/panel/inventory/consumption" element={<DailyConsumptionPage />} />
            <Route path="/app/panel/add-stock" element={<AddStockPage />} />
            <Route path="/app/panel/bills" element={<BillsPage />} />
            <Route path="/app/panel/sites" element={<SitesPage />} />
            <Route path="/app/panel/sites/create" element={<SiteFormPage />} />
            <Route path="/app/panel/sites/edit" element={<SiteFormPage />} />
            <Route path="/app/panel/sites/detail" element={<SiteDetailPage />} />
            <Route path="/app/panel/sites/consumption" element={<SiteConsumptionPage />} />
            <Route path="/app/panel/sites/:siteName/consumption/:unitLabel" element={<ConsumptionLogsPage />} />
            <Route path="/app/panel/vendors" element={<VendorsPage />} />
            <Route path="/app/panel/vendors/detail" element={<VendorDetailPage />} />
            <Route path="/app/panel/transit" element={<TransitPage />} />
            <Route path="/app/panel/dashboard" element={<DashboardPage />} />
            <Route path="/app/panel/dashboard/:monthYear" element={<DashboardMonthPage />} />
            <Route path="/app/panel/consumption" element={<ConsumptionPage />} />
            {/* Add more protected routes here */}
          </Route>
        </Route>
      </Routes>
      </SkeletonTheme>
    </BrowserRouter>
  )
}

export default App
