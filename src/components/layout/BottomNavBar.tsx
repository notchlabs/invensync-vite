import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ShoppingCart, ReceiptIndianRupee, Users } from 'lucide-react'

export interface BottomNavItem {
  label: string
  path: string
  icon: typeof Package
  checkActive: (pathname: string) => boolean
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  {
    label: 'Consumption',
    path: '/app/panel/consumption',
    icon: ShoppingCart,
    checkActive: (pathname: string) => pathname.startsWith('/app/panel/consumption'),
  },
  {
    label: 'Credit Customers',
    path: '/app/panel/credit-customers',
    icon: Users,
    checkActive: (pathname: string) => pathname.startsWith('/app/panel/credit-customers'),
  },
  {
    label: 'View Day Sales',
    path: '/app/panel/inventory/consumption',
    icon: ReceiptIndianRupee,
    checkActive: (pathname: string) =>
      pathname.startsWith('/app/panel/inventory/consumption'),
  },
]

export function BottomNavBar() {
  const location = useLocation()

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border-main/80 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] px-3 py-1.5 transition-colors duration-300"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 gap-1 relative items-center">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.checkActive(location.pathname)

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className="relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 group select-none cursor-pointer"
            >
              {/* Subtle Uniform Active Pill */}
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
                  size={19}
                  className={`transition-all duration-150 ${
                    isActive
                      ? 'text-primary-text scale-105 font-bold'
                      : 'text-muted-text group-hover:text-secondary-text group-active:scale-95'
                  }`}
                />
              </div>

              {/* Label */}
              <span
                className={`relative z-10 text-[11px] tracking-tight text-center leading-none transition-colors duration-150 ${
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
