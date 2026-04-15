import { useState, useRef, useEffect } from 'react'
import { Outlet, useLocation, Link, useSearchParams } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { Menu, PanelLeft, Sun, Moon, MoreVertical, LogOut } from 'lucide-react'
import { AppSidebar } from '../components/layout/AppSidebar'
import { NAV_ITEMS } from '../config/navigation'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'

/* ── Account dropdown ────────────────────────────────────── */
function AccountMenu() {
  const { instance, accounts } = useMsal()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const activeAccount = accounts[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try {
      await instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin })
    } catch (e: unknown) {
      console.error('Logout failed:', e)
      const error = e as { message?: string }
      toast.error(error.message || 'Logout failed. Please try again.')
    }
  }

  if (!activeAccount) return null
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2.5 py-1.5 bg-surface border border-border-main rounded-lg hover:bg-card transition-colors cursor-pointer"
      >
        <div className="w-6 h-6 bg-primary-text rounded-full flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-card">
            {activeAccount.name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>
        <span className="text-[13px] font-medium text-secondary-text max-w-[110px] truncate hidden sm:block">
          {activeAccount.name ?? activeAccount.username}
        </span>
        <MoreVertical size={14} className="text-muted-text ml-0.5" />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 bg-card border border-border-main shadow-md rounded-xl overflow-hidden z-50 min-w-[160px] animate-[fadeInDown_0.15s_ease-out_both]">
          <div className="p-1.5">
            <button
              onClick={() => { setOpen(false); handleLogout() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const AppLayout = () => {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const currentNav = NAV_ITEMS.find(item => location.pathname.startsWith(item.path)) || 
    (location.pathname.startsWith('/app/panel/consumption') ? NAV_ITEMS.find(i => i.label === 'Inventory') || NAV_ITEMS[0] : NAV_ITEMS[0])

  const toTitleCase = (s: string) =>
    s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1))

  const getBreadcrumbLabel = () => {
    const name = searchParams.get('name') || ''
    if (location.pathname.includes('/sites/edit')) {
      return name ? toTitleCase(`Edit / ${name}`) : 'Edit'
    }
    if (location.pathname.includes('/sites/detail')) {
      return toTitleCase(name || 'Detail')
    }
    if (location.pathname.includes('/vendors/detail')) {
      return toTitleCase(name || 'Detail')
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
            {toTitleCase(decodedSiteName)}
          </Link>
          <span className="text-muted-text/40 font-normal mx-1">/</span>
          <Link to={`/app/panel/sites/consumption?id=${siteIdParam}&name=${encodeURIComponent(decodedSiteName)}`} className="text-blue-600 dark:text-blue-500 hover:underline transition-all">
            Consumption
          </Link>
          <span className="text-muted-text/40 font-normal mx-1">/</span>
          {toTitleCase(decodedUnitLabel)}
        </>
      )
    }
    if (location.pathname.includes('/sites/consumption')) {
      const id = searchParams.get('id')
      return name ? (
        <>
          <Link to={`/app/panel/sites/detail?id=${id}&name=${encodeURIComponent(name)}`} className="text-blue-600 dark:text-blue-500 hover:underline transition-all">
            {toTitleCase(name)}
          </Link>
          {' / Consumption'}
        </>
      ) : 'Consumption'
    }
    if (location.pathname.startsWith(currentNav.path)) {
      return location.pathname
        .slice(currentNav.path.length)
        .split('/')
        .filter(Boolean)
        .map(p => toTitleCase(p.replace(/-/g, ' ')))
        .join(' / ')
    }

    // Fallback: extract last segment
    return toTitleCase(location.pathname.split('/').pop()?.replace(/-/g, ' ') || '')
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
                  <h1 className="text-primary-text m-0 p-0">
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

            <AccountMenu />
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
