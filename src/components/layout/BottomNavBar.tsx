import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMsal } from '@azure/msal-react'
import {
  LayoutDashboard,
  Building2,
  Package,
  Plus,
  Users,
  ReceiptIndianRupee,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react'

export interface BottomNavItem {
  label: string
  path: string
  icon: LucideIcon
  isCenterPlus?: boolean
  checkActive: (pathname: string) => boolean
}

export function BottomNavBar() {
  const location = useLocation()
  const { accounts } = useMsal()

  const claims = (accounts[0]?.idTokenClaims ?? {}) as Record<string, unknown>
  const tokenRoles: string[] = Array.isArray(claims['roles'])
    ? (claims['roles'] as string[])
    : []

  const isAdmin = tokenRoles.includes('ADMIN')
  const isManager = !isAdmin && tokenRoles.includes('MANAGER')

  let items: BottomNavItem[] = []

  if (isAdmin) {
    items = [
      {
        label: 'Dashboard',
        path: '/app/panel/dashboard',
        icon: LayoutDashboard,
        checkActive: (p) => p.startsWith('/app/panel/dashboard'),
      },
      {
        label: 'Inventory',
        path: '/app/panel/inventory',
        icon: Package,
        checkActive: (p) => p === '/app/panel/inventory',
      },
      {
        label: 'Add Stock',
        path: '/app/panel/add-stock',
        icon: Plus,
        isCenterPlus: true,
        checkActive: (p) => p.startsWith('/app/panel/add-stock'),
      },
      {
        label: 'Credit',
        path: '/app/panel/credit-customers',
        icon: Users,
        checkActive: (p) => p.startsWith('/app/panel/credit-customers'),
      },
      {
        label: 'Day Sales',
        path: '/app/panel/inventory/consumption',
        icon: ReceiptIndianRupee,
        checkActive: (p) => p.startsWith('/app/panel/inventory/consumption'),
      },
    ]
  } else if (isManager) {
    items = [
      {
        label: 'Sites',
        path: '/app/panel/sites',
        icon: Building2,
        checkActive: (p) => p.startsWith('/app/panel/sites'),
      },
      {
        label: 'Inventory',
        path: '/app/panel/inventory',
        icon: Package,
        checkActive: (p) => p === '/app/panel/inventory',
      },
      {
        label: 'Add Stock',
        path: '/app/panel/add-stock',
        icon: Plus,
        isCenterPlus: true,
        checkActive: (p) => p.startsWith('/app/panel/add-stock'),
      },
      {
        label: 'Credit',
        path: '/app/panel/credit-customers',
        icon: Users,
        checkActive: (p) => p.startsWith('/app/panel/credit-customers'),
      },
      {
        label: 'Day Sales',
        path: '/app/panel/inventory/consumption',
        icon: ReceiptIndianRupee,
        checkActive: (p) => p.startsWith('/app/panel/inventory/consumption'),
      },
    ]
  } else {
    items = [
      {
        label: 'Consumption',
        path: '/app/panel/consumption',
        icon: ShoppingCart,
        checkActive: (p) => p.startsWith('/app/panel/consumption'),
      },
      {
        label: 'Credit Customers',
        path: '/app/panel/credit-customers',
        icon: Users,
        checkActive: (p) => p.startsWith('/app/panel/credit-customers'),
      },
      {
        label: 'View Day Sales',
        path: '/app/panel/inventory/consumption',
        icon: ReceiptIndianRupee,
        checkActive: (p) => p.startsWith('/app/panel/inventory/consumption'),
      },
    ]
  }

  const isFiveCol = items.length === 5

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border-main/80 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] px-2 py-1.5 transition-colors duration-300"
    >
      <div className={`max-w-md mx-auto grid ${isFiveCol ? 'grid-cols-5' : 'grid-cols-3'} gap-1 relative items-center`}>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.checkActive(location.pathname)

          if (item.isCenterPlus) {
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className="relative flex flex-col items-center justify-center -mt-3.5 group select-none cursor-pointer z-10"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md group-active:scale-95 ${
                    isActive
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 ring-2 ring-emerald-500'
                      : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:scale-105'
                  }`}
                >
                  <Plus size={22} strokeWidth={2.8} />
                </div>
                <span className="text-[9.5px] tracking-tight text-center font-bold text-primary-text mt-0.5 whitespace-nowrap">
                  Add Stock
                </span>
              </NavLink>
            )
          }

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className="relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-150 group select-none cursor-pointer"
            >
              {/* Active Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavActivePill"
                  className="absolute inset-0 bg-surface dark:bg-surface border border-border-main/60 rounded-xl shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}

              {/* Icon Container */}
              <div className="relative z-10 flex items-center justify-center mb-1">
                <Icon
                  size={isFiveCol ? 18 : 19}
                  className={`transition-all duration-150 ${
                    isActive
                      ? 'text-primary-text scale-105 font-bold'
                      : 'text-muted-text group-hover:text-secondary-text group-active:scale-95'
                  }`}
                />
              </div>

              {/* Label */}
              <span
                className={`relative z-10 text-[10px] tracking-tight text-center leading-none transition-colors duration-150 truncate max-w-full ${
                  isActive
                    ? 'text-primary-text font-bold'
                    : 'text-muted-text font-medium group-hover:text-secondary-text'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
