import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const LAST_UPDATED = 'April 15, 2026'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-[20px] font-bold text-black mb-3 font-display">{title}</h2>
    <div className="text-[15px] text-neutral-600 leading-relaxed space-y-3">{children}</div>
  </section>
)

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white font-body">
      {/* Top bar */}
      <div className="border-b border-neutral-100 bg-white sticky top-0 z-10">
        <div className="max-w-[760px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-[15px] font-black text-black tracking-tight">InvenSync</Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[760px] mx-auto px-6 py-16 max-md:py-10">
        <div className="mb-12">
          <span className="inline-block text-[11px] font-bold tracking-[2px] uppercase text-neutral-500 mb-4 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-full">
            Legal
          </span>
          <h1 className="text-[40px] max-md:text-[30px] font-bold text-black tracking-tight mb-3 font-display">
            Privacy Policy
          </h1>
          <p className="text-[14px] text-neutral-400 font-medium">Last updated: {LAST_UPDATED}</p>
        </div>

        <Section title="1. Introduction">
          <p>
            Notch Labs ("we", "our", "us") operates InvenSync. This Privacy Policy explains how we collect, use, store, and protect information when you use our Service. We are committed to handling your data responsibly and transparently.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We collect the following categories of information:</p>
          <p><strong className="text-neutral-800">Account Information</strong> — Your name, email address, phone number, and organisation details provided during registration or through the contact form.</p>
          <p><strong className="text-neutral-800">Business Data</strong> — Invoices, bills, product catalogues, vendor records, site information, inventory levels, consumption logs, and financial data that you upload or generate within the Service.</p>
          <p><strong className="text-neutral-800">Usage Data</strong> — Information about how you interact with the Service, including pages visited, features used, and actions taken, collected via server logs and analytics tools.</p>
          <p><strong className="text-neutral-800">Authentication Data</strong> — Identity information provided through Microsoft Azure Active Directory (MSAL) during sign-in. We do not store your Microsoft password.</p>
          <p><strong className="text-neutral-800">Communication Data</strong> — Messages you send us via the contact form or support channels.</p>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide, operate, and improve the InvenSync Service</li>
            <li>Process AI extraction on invoices and bills you upload</li>
            <li>Generate purchase order recommendations and reports</li>
            <li>Send transactional emails (account activity, billing notifications)</li>
            <li>Respond to support requests and inquiries</li>
            <li>Detect, prevent, and address fraud or security incidents</li>
            <li>Comply with applicable legal obligations</li>
          </ul>
          <p>We do not use your business data to train AI models for purposes outside of your own Service experience.</p>
        </Section>

        <Section title="4. AI Processing">
          <p>
            InvenSync uses AI to extract structured data from invoice and bill images you upload. This processing occurs on secure servers. Uploaded documents are used solely to return extraction results to you and are not shared with third parties or used to train general-purpose AI models.
          </p>
          <p>
            AI-generated purchase order recommendations are derived from your own inventory and consumption data only.
          </p>
        </Section>

        <Section title="5. Data Sharing">
          <p>We do not sell or rent your personal or business data. We share data only in the following limited circumstances:</p>
          <p><strong className="text-neutral-800">Service Providers</strong> — Trusted third-party vendors who help us operate the Service (e.g., cloud hosting, database infrastructure, email delivery). These providers are contractually bound to protect your data.</p>
          <p><strong className="text-neutral-800">Legal Requirements</strong> — If required by law, court order, or government authority, we may disclose information as legally obligated.</p>
          <p><strong className="text-neutral-800">Business Transfers</strong> — In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction. We will notify you before your data becomes subject to a different privacy policy.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain your account and business data for as long as your subscription is active. If you cancel your account, you may export your data within 30 days of cancellation. After this window, your data is permanently deleted from our systems.
          </p>
          <p>
            Certain records (e.g., billing history) may be retained for up to 7 years as required by Indian accounting and tax regulations.
          </p>
        </Section>

        <Section title="7. Security">
          <p>
            We implement industry-standard security measures to protect your data, including encrypted data transmission (HTTPS/TLS), access controls, and role-based permissions within the platform (Admin, Manager, Staff roles).
          </p>
          <p>
            While we take reasonable steps to secure your data, no system is completely impenetrable. You are responsible for keeping your account credentials secure and for promptly reporting any unauthorised access.
          </p>
        </Section>

        <Section title="8. Cookies and Tracking">
          <p>
            We use essential cookies required for authentication and session management. We may use analytics tools to understand how the Service is used in aggregate. We do not use advertising cookies or cross-site tracking.
          </p>
          <p>
            You can control cookies through your browser settings, though disabling certain cookies may affect Service functionality.
          </p>
        </Section>

        <Section title="9. reCAPTCHA">
          <p>
            Our contact form uses Google reCAPTCHA v3 to protect against spam and abuse. reCAPTCHA collects hardware and software information and sends it to Google for analysis. Use of reCAPTCHA is subject to Google's Privacy Policy and Terms of Service.
          </p>
        </Section>

        <Section title="10. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Request deletion of your data (subject to legal retention requirements)</li>
            <li>Export your business data in a portable format</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p>To exercise any of these rights, contact us through the contact form on our website.</p>
        </Section>

        <Section title="11. Children's Privacy">
          <p>
            InvenSync is not directed at individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with their information, please contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. The "Last updated" date at the top of this page reflects the most recent revision.
          </p>
          <p>
            Continued use of the Service after a policy update constitutes your acceptance of the revised policy.
          </p>
        </Section>

        <Section title="13. Contact Us">
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please reach out through the contact form on our website. We will respond within 5 business days.
          </p>
        </Section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[13px] text-neutral-400">© 2026 InvenSync · Developed by Notch Labs</p>
          <div className="flex gap-5 text-[13px]">
            <Link to="/terms" className="text-neutral-500 hover:text-black transition-colors font-medium">Terms of Service</Link>
            <Link to="/" className="text-neutral-500 hover:text-black transition-colors font-medium">Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
