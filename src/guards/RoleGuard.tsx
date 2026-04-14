import { Navigate, Outlet } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { Loader2 } from 'lucide-react'

interface RoleGuardProps {
  requiredRoles: string[]
}

/**
 * Reads roles from the MSAL ID-token claims (idTokenClaims.roles[]).
 * Renders children only when the signed-in account has at least one requiredRole.
 * Redirects to /unauthorized otherwise.
 */
const RoleGuard = ({ requiredRoles }: RoleGuardProps) => {
  const { accounts, inProgress } = useMsal()

  // AuthGuard already waits for MSAL, but be safe if rendered independently
  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-text" />
      </div>
    )
  }

  const claims = accounts[0]?.idTokenClaims ?? {}
  // idTokenClaims is Record<string,unknown> — must runtime-check the array
  const rawRoles = claims['roles']
  const tokenRoles: string[] = Array.isArray(rawRoles) ? rawRoles : []

  const hasAccess = tokenRoles.some(r => requiredRoles.includes(r))

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default RoleGuard
