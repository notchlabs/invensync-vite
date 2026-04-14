import { useNavigate } from 'react-router-dom'
import { Compass, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center px-6">
      {/* Brand */}
      <p className="text-[12px] font-black text-muted-text uppercase tracking-widest mb-12">
        InvenSync
      </p>

      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-surface border border-border-main flex items-center justify-center mb-6 shadow-sm">
        <Compass size={36} className="text-muted-text" />
      </div>

      {/* Status */}
      <p className="text-[11px] font-black text-muted-text uppercase tracking-widest mb-3">
        404 Not Found
      </p>

      {/* Heading */}
      <h1 className="text-[28px] font-black text-primary-text tracking-tight text-center leading-tight mb-3">
        Page Not Found
      </h1>

      {/* Description */}
      <p className="text-[14px] font-medium text-secondary-text text-center max-w-[340px] leading-relaxed mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>

      {/* Action */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-border-main text-primary-text rounded-xl text-[13px] font-bold hover:bg-card active:scale-[0.98] transition-all cursor-pointer"
      >
        <ArrowLeft size={14} />
        Go back
      </button>
    </div>
  )
}
