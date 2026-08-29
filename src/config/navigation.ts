import {
  LayoutDashboard,
  Building2,
  Truck,
  Package,
  PlusSquare,
  FileText,
  Users,
  UserCheck,
  Receipt,
  Box,
  BarChart,
  FolderOpen,
  MoreHorizontal,
  type LucideIcon
} from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  path?: string
  requiredRoles?: string[]
  children?: NavItem[]
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
  { label: 'Vendors',          icon: Users,           path: '/app/panel/vendors',          requiredRoles: ADMIN_OR_MANAGER },
  { label: 'Credit Customers', icon: UserCheck,       path: '/app/panel/credit-customers' },
  {
    label: 'Other',
    icon: MoreHorizontal,
    requiredRoles: ADMIN_OR_MANAGER,
    children: [
      { label: 'Purchase Order', icon: Receipt,         path: '/app/panel/purchase-orders',  requiredRoles: ADMIN_OR_MANAGER },
      { label: 'Products',       icon: Box,             path: '/app/panel/products',         requiredRoles: ADMIN_OR_MANAGER },
      { label: 'Reports',        icon: BarChart,        path: '/app/panel/reports',          requiredRoles: ADMIN_OR_MANAGER },
      { label: 'Documents',      icon: FolderOpen,      path: '/app/panel/documents',        requiredRoles: ADMIN_OR_MANAGER },
    ]
  }
]

export const FLAT_NAV_ITEMS: { label: string; icon: LucideIcon; path: string; requiredRoles?: string[] }[] = NAV_ITEMS.flatMap(item => {
  if (item.children) {
    return item.children.map(child => ({
      label: child.label,
      icon: child.icon,
      path: child.path!,
      requiredRoles: child.requiredRoles ?? item.requiredRoles
    }))
  }
  return [{ label: item.label, icon: item.icon, path: item.path!, requiredRoles: item.requiredRoles }]
})

export const SIDEBAR_WIDTH = 280

