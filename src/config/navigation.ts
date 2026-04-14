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
  type LucideIcon 
} from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  path: string
  requiredRoles?: string[]
}

export const ADMIN_ONLY = ['ADMIN']
export const ADMIN_OR_MANAGER = ['ADMIN', 'MANAGER']

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',      icon: LayoutDashboard, path: '/app/panel/dashboard',        requiredRoles: ADMIN_ONLY },
  { label: 'All Sites',      icon: Building2,       path: '/app/panel/sites',            requiredRoles: ADMIN_OR_MANAGER },
  { label: 'Transit',        icon: Truck,           path: '/app/panel/transit',          requiredRoles: ADMIN_OR_MANAGER },
  { label: 'Inventory',      icon: Package,         path: '/app/panel/inventory' },
  { label: 'Add Stock',      icon: PlusSquare,      path: '/app/panel/add-stock',        requiredRoles: ADMIN_OR_MANAGER },
  { label: 'Bill Details',   icon: FileText,        path: '/app/panel/bills',            requiredRoles: ADMIN_OR_MANAGER },
  { label: 'Vendors',        icon: Users,           path: '/app/panel/vendors',          requiredRoles: ADMIN_OR_MANAGER },
  { label: 'Purchase Order', icon: Receipt,         path: '/app/panel/purchase-orders',  requiredRoles: ADMIN_OR_MANAGER },
  { label: 'Products',       icon: Box,             path: '/app/panel/products',         requiredRoles: ADMIN_OR_MANAGER },
  { label: 'Reports',        icon: BarChart,        path: '/app/panel/reports',          requiredRoles: ADMIN_OR_MANAGER },
]

export const SIDEBAR_WIDTH = 280
