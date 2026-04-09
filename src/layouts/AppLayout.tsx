import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { useTheme } from '../context/ThemeContext'
import { 
  LayoutDashboard, 
  Building2, 
  Truck, 
  Package, 
  PlusSquare, 
  FileText, 
  Users, 
  Receipt, 
  Box, 
  BarChart,
  Menu,
  PanelLeft,
  Sun,
  Moon
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/app/panel/dashboard' },
  { label: 'All Sites', icon: Building2, path: '/app/panel/sites' },
  { label: 'Transit', icon: Truck, path: '/app/panel/transit' },
  { label: 'Inventory', icon: Package, path: '/app/panel/inventory' },
  { label: 'Add Stock', icon: PlusSquare, path: '/app/panel/add-stock' },
  { label: 'Bill Details', icon: FileText, path: '/app/panel/bills' },
  { label: 'Vendors', icon: Users, path: '/app/panel/vendors' },
  { label: 'Purchase Order', icon: Receipt, path: '/app/panel/purchase-orders' },
  { label: 'Products', icon: Box, path: '/app/panel/products' },
  { label: 'Reports', icon: BarChart, path: '/app/panel/reports' },
]

const AppLayout = () => {
  const location = useLocation()
  const { accounts } = useMsal()
  const activeAccount = accounts[0]
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { theme, toggleTheme } = useTheme()
  
  const currentNav = NAV_ITEMS.find(item => location.pathname.startsWith(item.path)) || NAV_ITEMS[0]
  const CurrentIcon = currentNav.icon

  return (
    <div className="h-screen overflow-hidden bg-app flex font-sans transition-colors duration-300">
      {/* Sidebar - Hidden on mobile, visible on lg */}
      <aside 
        className={`${isCollapsed ? 'w-[80px]' : 'w-[280px]'} bg-sidebar border-r border-border-main hidden lg:flex flex-col sticky top-0 h-screen overflow-y-auto transition-all duration-300 ease-in-out`}
      >
        {/* Logo Area */}
        <div className={`p-6 border-b border-border-main/50 flex flex-col gap-1 transition-all ${isCollapsed ? 'items-center' : ''}`}>
          <div className="flex items-center gap-2.5 font-display text-[20px] font-bold text-primary-text tracking-tight">
            <img src="/android-chrome-192x192.png" alt="InvenSync" className="w-7 h-7 rounded-lg object-contain" />
            {!isCollapsed && <span>InvenSync</span>}
          </div>
          {!isCollapsed && <p className="text-[12px] text-secondary-text font-medium whitespace-nowrap">Smart inventory. Smarter Projects.</p>}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-6 flex flex-col gap-1`}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.label}
                to={item.path}
                title={isCollapsed ? item.label : ''}
                className={({ isActive }) => 
                  `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5 px-4'} py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-surface text-primary-text' 
                      : 'text-secondary-text hover:bg-surface hover:text-primary-text'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && <span className="text-[14px] font-semibold whitespace-nowrap">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer info */}
        <div className={`p-6 text-center transition-all ${isCollapsed ? 'px-2' : ''}`}>
          <p className="text-[11px] font-medium text-muted-text">v13.0.0</p>
          {!isCollapsed && <p className="text-[11px] font-medium text-muted-text">Developed by <span className="text-primary-text font-bold">Notch Labs</span></p>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-app transition-colors duration-300">
        {/* Top Header */}
        <header className="h-[60px] bg-header border-b border-border-main px-4 md:px-6 flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-4 text-primary-text">
            <Menu className="lg:hidden cursor-pointer text-secondary-text" size={20} />
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 hover:bg-surface rounded-md transition-colors text-secondary-text"
            >
              <PanelLeft size={18} />
            </button>
            <h1 className="text-[15px] font-bold tracking-tight">{currentNav.label}</h1>
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
