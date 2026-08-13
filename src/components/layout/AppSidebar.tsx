import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useMsal } from '@azure/msal-react'
import { X, ChevronDown } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { NAV_ITEMS, SIDEBAR_WIDTH } from '../../config/navigation'

interface AppSidebarProps {
  readonly isCollapsed: boolean
  readonly isMobileOpen: boolean
  readonly onMobileClose: () => void
}

/** Shared nav content rendered inside both desktop and mobile sidebars */
function SidebarContent({
  isCollapsed,
  onNavClick,
  theme,
}: Readonly<{
  isCollapsed: boolean
  onNavClick: () => void
  theme: string
}>) {
  const { accounts } = useMsal()
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  // Get roles from claims
  const claims = accounts[0]?.idTokenClaims ?? {}
  const tokenRoles: string[] = Array.isArray(claims['roles']) ? claims['roles'] : []

  // Filter visible items based on roles
  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.requiredRoles) return true
    return item.requiredRoles.some(r => tokenRoles.includes(r))
  }).map(item => {
    if (item.children) {
      const visibleChildren = item.children.filter(child => {
        if (!child.requiredRoles) return true
        return child.requiredRoles.some(r => tokenRoles.includes(r))
      })
      return { ...item, children: visibleChildren }
    }
    return item
  }).filter(item => !item.children || item.children.length > 0)

  // Automatically expand parent group if current route matches one of its children
  useEffect(() => {
    visibleItems.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => child.path && location.pathname.startsWith(child.path))
        if (isChildActive) {
          setOpenGroups(prev => ({ ...prev, [item.label]: true }))
        }
      }
    })
  }, [location.pathname])

  return (
    <>
      {/* Logo */}
      <NavLink
        to="/"
        className={[
          'px-4 py-4 border-b border-border-main/40 flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity',
          isCollapsed ? 'lg:justify-center lg:px-2' : '',
        ].join(' ')}
      >
        <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-sm">
          <img
            src={theme === 'dark' ? '/android-chrome-192x192.png' : '/inven_sync_dark.png'}
            alt="InvenSync"
            className="w-full h-full object-contain"
          />
        </div>
        <div className={`min-w-0 flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>
          <p className="font-display text-[16px] font-black text-primary-text tracking-tight leading-none">
            InvenSync
          </p>
          <p className="text-[10px] text-muted-text font-medium mt-0.5 truncate">
            Smart inventory. Smarter Projects.
          </p>
        </div>
      </NavLink>

      {/* Navigation */}
      <nav className={`flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto ${isCollapsed ? 'lg:px-2 px-3' : 'px-3'}`}>
        {visibleItems.map((item) => {
          if (item.children && item.children.length > 0) {
            const isGroupActive = item.children.some(child => child.path && location.pathname.startsWith(child.path))
            const isOpen = openGroups[item.label] ?? isGroupActive
            const Icon = item.icon

            return (
              <div key={item.label} className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpenGroups(prev => ({ ...prev, [item.label]: !isOpen }))
                  }}
                  title={isCollapsed ? item.label : ''}
                  className={[
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 group text-left cursor-pointer select-none',
                    isCollapsed ? 'lg:justify-center lg:px-0' : '',
                    isGroupActive && !isOpen
                      ? 'bg-surface/80 text-primary-text font-semibold'
                      : 'text-secondary-text hover:bg-surface/70 hover:text-primary-text',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={[
                        'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-150',
                        isGroupActive
                          ? 'bg-primary-text/10 text-primary-text'
                          : 'text-muted-text group-hover:text-primary-text',
                      ].join(' ')}
                    >
                      <Icon size={16} />
                    </span>
                    <span
                      className={`text-[13px] font-semibold whitespace-nowrap tracking-tight ${isCollapsed ? 'lg:hidden' : ''}`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`text-muted-text transition-transform duration-200 ${isCollapsed ? 'lg:hidden' : ''} ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <ChevronDown size={14} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden flex flex-col gap-0.5"
                    >
                      <div className={`flex flex-col gap-0.5 ${isCollapsed ? 'lg:pl-0' : 'pl-4 border-l-2 border-border-main/30 ml-4 py-1'}`}>
                        {item.children.map(child => {
                          const ChildIcon = child.icon
                          return (
                            <NavLink
                              key={child.label}
                              to={child.path!}
                              title={isCollapsed ? child.label : ''}
                              onClick={onNavClick}
                              className={({ isActive }) =>
                                [
                                  'flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group',
                                  isCollapsed ? 'lg:justify-center lg:px-0' : '',
                                  isActive
                                    ? 'bg-surface text-primary-text font-semibold'
                                    : 'text-secondary-text hover:bg-surface/70 hover:text-primary-text',
                                ].join(' ')
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <span
                                    className={[
                                      'flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all duration-150',
                                      isActive
                                        ? 'bg-primary-text/10 text-primary-text'
                                        : 'text-muted-text group-hover:text-primary-text',
                                    ].join(' ')}
                                  >
                                    <ChildIcon size={15} />
                                  </span>
                                  <span
                                    className={`text-[12.5px] font-medium whitespace-nowrap tracking-tight ${isCollapsed ? 'lg:hidden' : ''}`}
                                  >
                                    {child.label}
                                  </span>
                                </>
                              )}
                            </NavLink>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          }

          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.path!}
              title={isCollapsed ? item.label : ''}
              onClick={onNavClick}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group',
                  isCollapsed ? 'lg:justify-center lg:px-0' : '',
                  isActive
                    ? 'bg-surface text-primary-text font-semibold'
                    : 'text-secondary-text hover:bg-surface/70 hover:text-primary-text',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-150',
                      isActive
                        ? 'bg-primary-text/10 text-primary-text'
                        : 'text-muted-text group-hover:text-primary-text',
                    ].join(' ')}
                  >
                    <Icon size={16} />
                  </span>
                  <span
                    className={`text-[13px] font-semibold whitespace-nowrap tracking-tight ${isCollapsed ? 'lg:hidden' : ''}`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className={`px-4 py-4 border-t border-border-main/30 shrink-0 ${isCollapsed ? 'lg:px-2 lg:text-center' : ''}`}
      >
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'lg:justify-center' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-surface border border-border-main flex items-center justify-center shrink-0">
            <span className="text-[10px] font-black text-muted-text">NL</span>
          </div>
          <div className={`min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
            <p className="text-[11px] font-bold text-primary-text leading-none">Notch Labs</p>
            <p className="text-[10px] text-muted-text mt-0.5">v15.0.0</p>
          </div>
        </div>
      </div>
    </>
  )
}

export function AppSidebar({ isCollapsed, isMobileOpen, onMobileClose }: AppSidebarProps) {
  const { theme } = useTheme()

  return (
    <>
      {/* ── Desktop sidebar (CSS width transition, always mounted) ── */}
      <aside
        className={[
          'hidden lg:flex flex-col sticky top-0 h-screen',
          'bg-sidebar border-r border-border-main overflow-hidden',
          'transition-[width] duration-300 ease-in-out',
          isCollapsed ? 'w-[80px]' : 'w-[280px]',
        ].join(' ')}
      >
        <SidebarContent isCollapsed={isCollapsed} onNavClick={() => {}} theme={theme} />
      </aside>

      {/* ── Mobile: backdrop + slide-in drawer (Framer Motion) ────── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.button
              key="backdrop"
              aria-label="Close navigation"
              onClick={onMobileClose}
              className="fixed inset-0 z-40 w-full bg-black/60 backdrop-blur-sm lg:hidden cursor-default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              className="fixed top-0 left-0 h-full z-50 flex flex-col lg:hidden bg-sidebar border-r border-border-main shadow-2xl overflow-hidden"
              style={{ width: SIDEBAR_WIDTH }}
              initial={{ x: -SIDEBAR_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_WIDTH }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 32,
                mass: 0.8,
              }}
            >
              {/* Close button */}
              <button
                onClick={onMobileClose}
                className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-lg hover:bg-surface text-muted-text hover:text-primary-text transition-colors"
              >
                <X size={16} />
              </button>

              <SidebarContent isCollapsed={false} onNavClick={onMobileClose} theme={theme} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
