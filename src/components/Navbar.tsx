import { useEffect, useState, useRef } from 'react'
import { Menu, X, LogIn, ExternalLink, MoreVertical, LogOut } from 'lucide-react'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { loginRequest } from '../config/msal'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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
      className={`fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300 backdrop-blur-xl border-b ${
        scrolled
          ? 'bg-white/95 border-neutral-200'
          : 'bg-white/60 border-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 font-display text-[22px] font-bold text-black tracking-tight hover:opacity-85 transition-opacity">
          <img src="/android-chrome-192x192.png" alt="InvenSync" className="w-8 h-8 rounded-lg object-contain" />
          <span>InvenSync</span>
        </a>

        {/* Desktop Links */}
        <div className={`flex items-center gap-9 max-md:fixed max-md:top-16 max-md:left-0 max-md:right-0 max-md:flex-col max-md:bg-white/[0.97] max-md:backdrop-blur-xl max-md:p-6 max-md:gap-5 max-md:border-b max-md:border-neutral-200 max-md:transition-all max-md:duration-300 ${
          mobileOpen ? 'max-md:translate-y-0 max-md:opacity-100 max-md:pointer-events-auto' : 'max-md:-translate-y-[120%] max-md:opacity-0 max-md:pointer-events-none'
        }`}>
          {['Features', 'Pricing', 'About', 'Contact'].map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              onClick={() => setMobileOpen(false)}
              className="text-[15px] font-medium text-neutral-600 hover:text-black transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-black after:rounded-sm after:transition-all hover:after:w-full"
            >
              {link}
            </a>
          ))}

          {/* Mobile Login / User Info */}
          {isAuthenticated ? (
            <Link
              to="/app/panel/inventory"
              onClick={() => setMobileOpen(false)}
              className="md:hidden mt-2 pt-4 w-full text-center border-t border-neutral-100 text-[15px] font-bold text-black hover:text-neutral-600 transition-colors"
            >
              Go to Panel →
            </Link>
          ) : (
            <button
              onClick={() => { setMobileOpen(false); handleLogin(); }}
              className="md:hidden mt-2 pt-4 w-full text-center border-t border-neutral-100 text-[15px] font-bold text-black hover:text-neutral-600 transition-colors"
            >
              Log into your account
            </button>
          )}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && activeAccount ? (
            <>
              <Link
                to="/app/panel/inventory"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-black border border-black rounded-lg hover:bg-neutral-800 transition-all"
              >
                <ExternalLink size={14} />
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
                  <MoreVertical size={16} className="text-neutral-400 ml-0.5" />
                </button>
                {menuOpen && (
                  <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-neutral-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden z-50 min-w-[160px] animate-[fadeInUp_0.15s_ease-out_both]">
                    <div className="p-1.5">
                      <button
                        onClick={() => { setMenuOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="text-[13px] font-medium text-neutral-500 max-lg:hidden">Already have an account?</span>
              <button
                onClick={handleLogin}
                className="inline-flex cursor-pointer items-center gap-1.5 px-5 py-2 text-[14px] font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 hover:text-black transition-all shadow-sm"
              >
                <LogIn size={14} />
                Log in
              </button>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden p-1 text-neutral-600"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  )
}

export default Navbar
