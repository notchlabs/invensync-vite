import { useEffect, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, User, Phone, Briefcase, Package, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { CustomSelect } from './common/CustomSelect'
import { ContactService } from '../services/contact'
import toast from 'react-hot-toast'

const RECAPTCHA_SITE_KEY = '6LeDpK4sAAAAAK-2VMwMnn_MceJ_KRgVJTGRxyQW'

interface ReCaptchaV3 {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha: ReCaptchaV3;
  }
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export const FooterCTA = () => {
  const [useCase, setUseCase] = useState("")
  const [plan, setPlan] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [formStatus, setFormStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState("")

  // Load the reCAPTCHA v3 script on mount
  useEffect(() => {
    if (document.getElementById('recaptcha-script')) return

    const script = document.createElement('script')
    script.id = 'recaptcha-script'
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setFieldErrors({})

    // ------- Client-side validation -------
    const errors: Record<string, string> = {}

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.'
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address.'
    }

    if (!phone.trim()) {
      errors.phone = 'Phone number is required.'
    } else if (!/^\d{10}$/.test(phone.trim())) {
      errors.phone = 'Enter a valid 10-digit phone number.'
    }

    if (!useCase) {
      errors.useCase = 'Please select a use case.'
    }
    if (!plan) {
      errors.plan = 'Please select a plan.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFormStatus('loading')

    // Get reCAPTCHA v3 token invisibly
    let recaptchaToken = ''
    if (window.grecaptcha) {
      try {
        await new Promise<void>(resolve => window.grecaptcha.ready(resolve))
        recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' })
      } catch (e) {
        console.warn('reCAPTCHA execute error:', e)
      }
    }

    if (!recaptchaToken) {
      setFormStatus('idle')
      toast.error('reCAPTCHA verification failed. Please try again.')
      return
    }

    try {
      const res = await ContactService.submitContactForm({
        fullName: fullName.trim(),
        emailAddress: email.trim(),
        phoneNumber: `+91${phone.trim()}`,
        primaryUseCase: useCase,
        interestedPlan: plan,
        recaptchaToken,
      })

      if (res.success) {
        setFormStatus('success')
        toast.success('Request submitted successfully! We\'ll be in touch soon.')
        // Reset form
        setFullName('')
        setEmail('')
        setPhone('')
        setUseCase('')
        setPlan('')
      } else {
        setFormStatus('error')
        const msg = res.message || 'Something went wrong. Please try again.'
        setErrorMessage(msg)
        toast.error(msg)
      }
    } catch (err: unknown) {
      setFormStatus('error')
      const typedErr = err as { message?: string }
      const msg = typedErr.message || 'Network error. Please try again.'
      setErrorMessage(msg)
      toast.error(msg)
    }
  }, [fullName, email, phone, useCase, plan])

  return (
    <footer className="bg-[#fafafa] border-t border-neutral-200 relative overflow-hidden" id="contact">
      {/* Premium Grid Background */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,black_20%,transparent_100%)]" />
      
      {/* Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,theme(colors.blue.500/6%),transparent_70%)] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,theme(colors.emerald.500/6%),transparent_70%)] rounded-full blur-3xl pointer-events-none" />
      
      {/* Abstract Blocks */}
      <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-white border border-neutral-200/50 rounded-2xl -rotate-12 shadow-sm opacity-60 pointer-events-none hidden md:block" />
      <div className="absolute bottom-[20%] left-[30%] w-24 h-24 bg-white border border-neutral-200/50 rounded-xl rotate-45 shadow-sm opacity-40 pointer-events-none hidden lg:block" />
      <div className="absolute top-[60%] right-[40%] w-16 h-16 bg-white border border-neutral-200/50 rounded-lg -rotate-12 shadow-sm opacity-50 pointer-events-none hidden lg:block" />
      <div className="absolute top-[-20px] right-[10%] w-48 h-48 bg-white border border-neutral-200/50 rounded-3xl rotate-[24deg] shadow-sm opacity-50 pointer-events-none hidden md:block" />

      {/* CTA Section */}
      <div className="max-w-[1200px] mx-auto px-6 pt-32 pb-24 max-md:pt-20 max-md:pb-16 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-16 lg:gap-24">
          
          {/* Left Text */}
          <div className="flex-1 text-center lg:text-left max-w-[600px]">
            <h2 className="text-[48px] max-md:text-[36px] font-bold text-black tracking-tight leading-[1.1] mb-6 font-display">
              Stop sorting bills.<br />
              <span className="text-neutral-500">Start running your business.</span>
            </h2>
            <p className="text-[18px] text-neutral-600 leading-relaxed mb-8">
              Join 7+ businesses that replaced chaos with clarity. 
              Get absolute control over your inventory, margins, and daily profits today.
            </p>

          </div>

          {/* Right Form */}
          <div className="w-full max-w-[420px] bg-white border border-neutral-200 rounded-2xl p-8 max-md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative transition-transform duration-500">
            <div className="text-center mb-6">
              <h3 className="text-[20px] font-bold text-black font-display mb-1">Get Access</h3>
              <p className="text-[13px] text-neutral-500">No long forms. No friction.</p>
            </div>
            
            {formStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-[18px] font-bold text-black font-display mb-1">Request Submitted!</h4>
                  <p className="text-[14px] text-neutral-500 leading-relaxed">
                    We'll reach out to you within 24 hours.<br />Thank you for your interest!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormStatus('idle')}
                  className="mt-2 text-[13px] font-semibold text-neutral-500 hover:text-black transition-colors underline underline-offset-4"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User size={16} className="text-neutral-400" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      value={fullName}
                      onChange={e => {
                        setFullName(e.target.value)
                        if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: '' }))
                      }}
                      className={`w-full pl-10 pr-4 py-3 bg-neutral-50 border rounded-lg text-[14px] font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all ${fieldErrors.fullName ? 'border-red-300 focus:border-red-400' : 'border-neutral-200 focus:border-neutral-400'}`}
                    />
                  </div>
                  {fieldErrors.fullName && <p className="text-[12px] text-red-500 font-medium mt-1 pl-1">{fieldErrors.fullName}</p>}
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail size={16} className="text-neutral-400" />
                    </div>
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value)
                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }))
                      }}
                      className={`w-full pl-10 pr-4 py-3 bg-neutral-50 border rounded-lg text-[14px] font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all ${fieldErrors.email ? 'border-red-300 focus:border-red-400' : 'border-neutral-200 focus:border-neutral-400'}`}
                    />
                  </div>
                  {fieldErrors.email && <p className="text-[12px] text-red-500 font-medium mt-1 pl-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <div className="relative flex">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone size={16} className="text-neutral-400" />
                    </div>
                    <span className="inline-flex items-center pl-10 pr-2 py-3 bg-neutral-100 border border-r-0 border-neutral-200 rounded-l-lg text-[14px] font-semibold text-neutral-500 select-none">
                      +91
                    </span>
                    <input 
                      type="tel" 
                      placeholder="10-digit number" 
                      value={phone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setPhone(val)
                        if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }))
                      }}
                      maxLength={10}
                      className="w-full pr-4 py-3 pl-3 bg-neutral-50 border border-neutral-200 rounded-r-lg text-[14px] font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-neutral-400 transition-all"
                    />
                  </div>
                  {fieldErrors.phone && <p className="text-[12px] text-red-500 font-medium mt-1 pl-1">{fieldErrors.phone}</p>}
                </div>

                <CustomSelect
                  icon={Briefcase}
                  placeholder="Primary Use Case"
                  value={useCase}
                  onChange={setUseCase}
                  options={[
                    { label: 'Construction & Sites', value: 'construction' },
                    { label: 'Cafe / Restaurant', value: 'cafe' },
                    { label: 'Manufacturing', value: 'manufacturing' },
                    { label: 'Multi-Branch Retail', value: 'retail' },
                    { label: 'Just Exploring', value: 'exploring' },
                  ]}
                />

                <CustomSelect
                  icon={Package}
                  placeholder="Interested Plan"
                  value={plan}
                  onChange={setPlan}
                  options={[
                    { label: 'Starter Plan', value: 'starter' },
                    { label: 'Professional Plan', value: 'professional' },
                    { label: 'Enterprise Plan', value: 'enterprise' },
                    { label: 'Not sure yet', value: 'unsure' },
                  ]}
                />


                {/* Error Message */}
                {formStatus === 'error' && errorMessage && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-[13px] font-medium text-red-700">
                    <AlertCircle size={14} className="shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={formStatus === 'loading'}
                  className="w-full py-3.5 mt-2 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg text-[15px] font-bold flex items-center justify-center gap-2 group transition-all"
                >
                  {formStatus === 'loading' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* Footer Bottom Line */}
      <div className="border-t border-neutral-100 bg-[#fafafa]">
        <div className="max-w-[1200px] mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-[13px] text-neutral-500 font-medium">
            <span>© 2026 InvenSync. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
            </div>
          </div>
          
          <a
            href="https://notchlabs.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-neutral-500 hover:text-black transition-colors"
          >
            <img
              src="/notchlabs_favicon-32x32.png"
              alt="Notch Labs Logo"
              width={16}
              height={16}
              className="w-4 h-4 rounded-full object-cover border border-neutral-200 shadow-sm"
            />
            <span>Developed by Notch Labs</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
