import { useNavigate } from 'react-router-dom'
import { ShieldOff, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center px-6 gap-0">
      {/* Brand */}
      <p className="text-[12px] font-black text-muted-text uppercase tracking-widest mb-12">
        InvenSync
      </p>

      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-surface border border-border-main flex items-center justify-center mb-6 shadow-sm">
        <ShieldOff size={36} className="text-muted-text" />
      </div>

      {/* Status */}
      <p className="text-[11px] font-black text-muted-text uppercase tracking-widest mb-3">
        403 Unauthorized
      </p>

      {/* Heading */}
      <h1 className="text-[28px] font-black text-primary-text tracking-tight text-center leading-tight mb-3">
        Access Denied
      </h1>

      {/* Description */}
      <p className="text-[14px] font-medium text-secondary-text text-center max-w-[340px] leading-relaxed mb-8">
        You don't have permission to view this page. Contact your administrator if you think this is a mistake.
      </p>

      {/* Action */}
      <button
        onClick={() => navigate('/app/panel/inventory')}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary-text text-card rounded-xl text-[13px] font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
      >
        <ArrowLeft size={14} />
        Go to Inventory
      </button>
    </div>
  )
}
