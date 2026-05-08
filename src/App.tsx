import './App.css'
import 'react-loading-skeleton/dist/skeleton.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { SkeletonTheme } from 'react-loading-skeleton'

// ─── Eagerly loaded (landing + legal — no MSAL needed) ───────────────────────
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'

// ─── Lazily loaded (panel — only fetched when user navigates to /app) ─────────
const AuthGuard         = lazy(() => import('./guards/AuthGuard'))
const AppLayout         = lazy(() => import('./layouts/AppLayout'))
const RoleGuard         = lazy(() => import('./guards/RoleGuard'))
const InventoryPage     = lazy(() => import('./pages/panel/InventoryPage'))
const DailyConsumptionPage = lazy(() => import('./pages/panel/DailyConsumptionPage'))
const ConsumptionPage   = lazy(() => import('./pages/panel/ConsumptionPage'))
const DashboardPage     = lazy(() => import('./pages/panel/DashboardPage'))
const DashboardMonthPage = lazy(() => import('./pages/panel/DashboardMonthPage'))
const AddStockPage      = lazy(() => import('./pages/panel/AddStockPage'))
const BillsPage         = lazy(() => import('./pages/panel/BillsPage'))
const SitesPage         = lazy(() => import('./pages/panel/SitesPage'))
const SiteFormPage      = lazy(() => import('./pages/panel/SiteFormPage'))
const SiteDetailPage    = lazy(() => import('./pages/panel/SiteDetailPage'))
const SiteConsumptionPage = lazy(() => import('./pages/panel/SiteConsumptionPage'))
const ConsumptionLogsPage = lazy(() => import('./pages/panel/ConsumptionLogsPage'))
const VendorsPage       = lazy(() => import('./pages/panel/VendorsPage'))
const VendorDetailPage  = lazy(() => import('./pages/panel/VendorDetailPage'))
const TransitPage       = lazy(() => import('./pages/panel/TransitPage'))
const ProductsPage      = lazy(() => import('./pages/panel/ProductsPage'))
const ReportsPage       = lazy(() => import('./pages/panel/ReportsPage'))
const PurchaseOrderPage = lazy(() => import('./pages/panel/PurchaseOrderPage'))
const DocumentsPage     = lazy(() => import('./pages/panel/DocumentsPage'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

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
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />

        <ScrollToTop />
        <Suspense fallback={null}>
          <Routes>
            {/* Public Routes */}
            <Route path="/"            element={<LandingPage />} />
            <Route path="/terms"       element={<TermsPage />} />
            <Route path="/privacy"     element={<PrivacyPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Routes — lazy-loaded; MSAL only initialised when visited */}
            <Route element={<AuthGuard />}>
              <Route element={<AppLayout />}>
                <Route path="/app/panel/inventory"             element={<InventoryPage />} />
                <Route path="/app/panel/inventory/consumption" element={<DailyConsumptionPage />} />
                <Route path="/app/panel/consumption"           element={<ConsumptionPage />} />

                {/* ADMIN */}
                <Route element={<RoleGuard requiredRoles={['ADMIN']} />}>
                  <Route path="/app/panel/dashboard"            element={<DashboardPage />} />
                  <Route path="/app/panel/dashboard/:monthYear" element={<DashboardMonthPage />} />
                </Route>

                {/* ADMIN or MANAGER */}
                <Route element={<RoleGuard requiredRoles={['ADMIN', 'MANAGER']} />}>
                  <Route path="/app/panel/add-stock"    element={<AddStockPage />} />
                  <Route path="/app/panel/bills"        element={<BillsPage />} />

                  <Route path="/app/panel/sites"                                      element={<SitesPage />} />
                  <Route path="/app/panel/sites/create"                               element={<SiteFormPage />} />
                  <Route path="/app/panel/sites/edit"                                 element={<SiteFormPage />} />
                  <Route path="/app/panel/sites/detail"                               element={<SiteDetailPage />} />
                  <Route path="/app/panel/sites/consumption"                          element={<SiteConsumptionPage />} />
                  <Route path="/app/panel/sites/:siteName/consumption/:unitLabel"     element={<ConsumptionLogsPage />} />

                  <Route path="/app/panel/vendors"        element={<VendorsPage />} />
                  <Route path="/app/panel/vendors/detail" element={<VendorDetailPage />} />

                  <Route path="/app/panel/transit"         element={<TransitPage />} />
                  <Route path="/app/panel/products"        element={<ProductsPage />} />
                  <Route path="/app/panel/reports"         element={<ReportsPage />} />
                  <Route path="/app/panel/purchase-orders" element={<PurchaseOrderPage />} />
                  <Route path="/app/panel/documents"       element={<DocumentsPage />} />
                </Route>
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </SkeletonTheme>
    </BrowserRouter>
  )
}

export default App
