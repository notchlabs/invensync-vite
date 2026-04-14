import { useState } from 'react'
import { Outlet, useLocation, Link, useSearchParams } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { useTheme } from '../context/ThemeContext'
import { Menu, PanelLeft, Sun, Moon } from 'lucide-react'
import { AppSidebar, NAV_ITEMS } from '../components/layout/AppSidebar'

const AppLayout = () => {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { accounts } = useMsal()
  const activeAccount = accounts[0]
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const currentNav = NAV_ITEMS.find(item => location.pathname.startsWith(item.path)) || NAV_ITEMS[0]

  const getBreadcrumbLabel = () => {
    const name = searchParams.get('name') || ''
    if (location.pathname.includes('/sites/edit')) {
      return name ? `edit / ${name}` : 'edit'
    }
    if (location.pathname.includes('/sites/detail')) {
      return name || 'detail'
    }
    if (location.pathname.includes('/vendors/detail')) {
      return name || 'detail'
    }
    // /app/panel/sites/:siteName/consumption/:unitLabel (logs page)
    const siteConsumptionLogsMatch = location.pathname.match(/\/sites\/([^/]+)\/consumption\/([^/]+)/)
    if (siteConsumptionLogsMatch) {
      const decodedSiteName = decodeURIComponent(siteConsumptionLogsMatch[1])
      const decodedUnitLabel = decodeURIComponent(siteConsumptionLogsMatch[2])
      const siteIdParam = searchParams.get('siteId')
      return (
        <>
          <Link to={`/app/panel/sites/detail?id=${siteIdParam}&name=${encodeURIComponent(decodedSiteName)}`} className="text-blue-600 dark:text-blue-500 hover:underline transition-all">
            {decodedSiteName}
          </Link>
          <span className="text-muted-text/40 font-normal mx-1">/</span>
          <Link to={`/app/panel/sites/consumption?id=${siteIdParam}&name=${encodeURIComponent(decodedSiteName)}`} className="text-blue-600 dark:text-blue-500 hover:underline transition-all">
            consumption
          </Link>
          <span className="text-muted-text/40 font-normal mx-1">/</span>
          {decodedUnitLabel}
        </>
      )
    }
    if (location.pathname.includes('/sites/consumption')) {
      const id = searchParams.get('id')
      return name ? (
        <>
          <Link to={`/app/panel/sites/detail?id=${id}&name=${encodeURIComponent(name)}`} className="text-blue-600 dark:text-blue-500 hover:underline transition-all">
            {name}
          </Link>
          {' / consumption'}
        </>
      ) : 'consumption'
    }
    return location.pathname
      .slice(currentNav.path.length)
      .split('/')
      .filter(Boolean)
      .map(p => p.replace(/-/g, ' '))
      .join(' / ')
  }

  return (
    <div className="h-screen overflow-hidden bg-app flex font-sans transition-colors duration-300">
      <AppSidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-app transition-colors duration-300">
        {/* Top Header */}
        <header className="h-[60px] bg-header border-b border-border-main px-4 md:px-6 flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-4 text-primary-text">
            {/* Hamburger — mobile */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-1 rounded-md hover:bg-surface transition-colors text-secondary-text"
            >
              <Menu size={20} />
            </button>
            {/* Collapse toggle — desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 hover:bg-surface rounded-md transition-colors text-secondary-text"
            >
              <PanelLeft size={18} />
            </button>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
              {location.pathname === currentNav.path ? (
                <h1 className="text-primary-text m-0 p-0">{currentNav.label}</h1>
              ) : (
                <>
                  <Link to={currentNav.path} className="text-blue-600 dark:text-blue-500 hover:underline transition-all">
                    {currentNav.label}
                  </Link>
                  <span className="text-muted-text/40 font-normal">/</span>
                  <h1 className="text-primary-text m-0 p-0 lowercase">
                    {getBreadcrumbLabel()}
                  </h1>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-main bg-card hover:bg-surface transition-all text-secondary-text hover:text-primary-text shadow-sm"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {activeAccount && (
              <div className="w-8 h-8 rounded-full bg-surface border border-border-main text-secondary-text flex items-center justify-center text-[12px] font-bold shadow-sm">
                {activeAccount.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppLayout
