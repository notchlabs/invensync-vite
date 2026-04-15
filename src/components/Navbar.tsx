import { useEffect, useState, useRef } from 'react'
import { Menu, X, LogIn, ExternalLink, MoreVertical, LogOut, ChevronDown, Zap, BarChart3, Package, TrendingUp, Truck, BookOpen, AlertCircle, ShoppingCart } from 'lucide-react'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { loginRequest } from '../config/msal'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: Zap,
    label: 'AI Bill Extraction',
    desc: 'Scan any invoice in seconds',
    href: '#features',
  },
  {
    icon: TrendingUp,
    label: 'Daily Profit View',
    desc: 'See today\'s margins instantly',
    href: '#features',
  },
  {
    icon: Package,
    label: 'Multi-Site Tracking',
    desc: 'All locations in one dashboard',
    href: '#features',
  },
  {
    icon: Truck,
    label: 'Transit Tracking',
    desc: 'Monitor stock in transit',
    href: '#features',
  },
  {
    icon: BookOpen,
    label: 'Vendor Ledger',
    desc: 'Payables & credit at a glance',
    href: '#features',
  },
  {
    icon: AlertCircle,
    label: 'Low-Stock Alerts',
    desc: 'Never run out of critical stock',
    href: '#features',
  },
  {
    icon: ShoppingCart,
    label: 'Smart Restock Orders',
    desc: 'AI-generated purchase orders',
    href: '#features',
  },
  {
    icon: BarChart3,
    label: 'Capital & P&L',
    desc: 'Full financial picture always',
    href: '#features',
  },
]

const NAV_LINKS = [
  { label: 'Problem', href: '#problem' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
]

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const featuresRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const activeAccount = accounts[0]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (featuresRef.current && !featuresRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false)
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogin = async () => {
    try {
      await instance.loginRedirect(loginRequest)
    } catch (error: unknown) {
      console.error('Login failed:', error)
      toast.error('Login failed. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      await instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin,
      })
    } catch (error: unknown) {
      console.error('Logout failed:', error)
      toast.error('Logout failed. Please try again.')
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/97 backdrop-blur-xl border-b border-neutral-200 shadow-[0_1px_12px_rgba(0,0,0,0.06)]'
          : 'bg-white/70 backdrop-blur-lg border-b border-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center justify-between gap-8">

        {/* ── Logo ── */}
        <a
          href="/"
          className="flex items-center gap-2.5 font-display text-[21px] font-bold text-black tracking-tight hover:opacity-85 transition-opacity shrink-0"
        >
          <img src="/inven_sync_dark.png" alt="InvenSync" className="w-8 h-8 rounded-lg object-contain" />
          <span>InvenSync</span>
        </a>

        {/* ── Desktop Nav ── */}
        <div className="hidden md:flex items-center gap-1 flex-1">

          {/* Features dropdown */}
          <div className="relative" ref={featuresRef}>
            <button
              onClick={() => setFeaturesOpen(v => !v)}
              onMouseEnter={() => setFeaturesOpen(true)}
              className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors ${
                featuresOpen ? 'bg-neutral-100 text-black' : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
              }`}
            >
              Features
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Mega-dropdown */}
            {featuresOpen && (
              <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[560px] bg-white border border-neutral-200 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden z-50 animate-[fadeInDown_0.15s_ease-out_both]">
                <div className="p-4">
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-2 mb-3">
                    Platform Features
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {FEATURES.map(({ icon: Icon, label, desc, href }) => (
                      <a
                        key={label}
                        href={href}
                        onClick={() => setFeaturesOpen(false)}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
                      >
                        <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-black transition-colors mt-0.5">
                          <Icon size={15} className="text-neutral-600 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-neutral-800 leading-tight">{label}</div>
                          <div className="text-[12px] text-neutral-400 mt-0.5">{desc}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="border-t border-neutral-100 px-6 py-3 bg-neutral-50 flex items-center justify-between">
                  <span className="text-[12px] text-neutral-500">Built for Indian businesses</span>
                  <a
                    href="#features"
                    onClick={() => setFeaturesOpen(false)}
                    className="text-[12px] font-semibold text-black hover:underline"
                  >
                    See all features →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Other nav links */}
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="px-3.5 py-2 rounded-lg text-[14px] font-medium text-neutral-600 hover:text-black hover:bg-neutral-50 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        {/* ── Desktop CTA ── */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {isAuthenticated && activeAccount ? (
            <>
              <Link
                to="/app/panel/inventory"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-black border border-black rounded-lg hover:bg-neutral-800 transition-all"
              >
                <ExternalLink size={13} />
                Go to Panel
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white">
                      {activeAccount.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <span className="text-[13px] font-medium text-neutral-700 max-w-[120px] truncate">
                    {activeAccount.name || activeAccount.username}
                  </span>
                  <MoreVertical size={15} className="text-neutral-400" />
                </button>
                {menuOpen && (
                  <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-neutral-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden z-50 min-w-[160px] animate-[fadeInDown_0.15s_ease-out_both]">
                    <div className="p-1.5">
                      <button
                        onClick={() => { setMenuOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut size={13} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleLogin}
                className="inline-flex cursor-pointer items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 hover:text-black transition-all"
              >
                <LogIn size={13} />
                Sign in
              </button>
              <a
                href="#contact"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-black rounded-lg hover:bg-neutral-800 transition-all"
              >
                Get Early Access
              </a>
            </>
          )}
        </div>

        {/* ── Hamburger ── */}
        <button
          className="md:hidden p-1.5 text-neutral-600 hover:text-black transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white/97 backdrop-blur-xl border-t border-neutral-100 px-4 py-3 flex flex-col gap-0.5">

          {/* Mobile Features accordion */}
          <button
            onClick={() => setMobileFeaturesOpen(v => !v)}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-[15px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Features
            <ChevronDown
              size={16}
              className={`text-neutral-400 transition-transform duration-200 ${mobileFeaturesOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {mobileFeaturesOpen && (
            <div className="ml-2 mb-1 grid grid-cols-2 gap-1 px-1">
              {FEATURES.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => { setMobileOpen(false); setMobileFeaturesOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-black transition-colors"
                >
                  <Icon size={13} className="shrink-0 text-neutral-400" />
                  {label}
                </a>
              ))}
            </div>
          )}

          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl text-[15px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              {label}
            </a>
          ))}

          <div className="border-t border-neutral-100 mt-2 pt-3 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to="/app/panel/inventory"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-black hover:bg-neutral-800 transition-colors"
              >
                Go to Panel →
              </Link>
            ) : (
              <>
                <a
                  href="#contact"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-black hover:bg-neutral-800 transition-colors"
                >
                  Get Early Access
                </a>
                <button
                  onClick={() => { setMobileOpen(false); handleLogin() }}
                  className="w-full text-center px-4 py-2 rounded-xl text-[14px] font-medium text-neutral-600 hover:text-black transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
