import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const LAST_UPDATED = 'April 15, 2026'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-[20px] font-bold text-black mb-3 font-display">{title}</h2>
    <div className="text-[15px] text-neutral-600 leading-relaxed space-y-3">{children}</div>
  </section>
)

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-[14px] text-neutral-400 font-medium">Last updated: {LAST_UPDATED}</p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using InvenSync ("Service"), operated by Notch Labs, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
          </p>
          <p>
            These Terms apply to all users, including businesses and individuals who access the Service in any capacity.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            InvenSync is a cloud-based inventory management platform designed for Indian businesses. The Service includes AI-powered bill extraction, real-time inventory tracking, multi-site management, daily profit visibility, vendor ledger management, transit tracking, and purchase order generation.
          </p>
          <p>
            We offer three subscription tiers — Starter, Professional, and Enterprise — each with defined limits on sites, AI credits, transfers, and consumptions per day.
          </p>
        </Section>

        <Section title="3. Account Registration">
          <p>
            You must register for an account to access the Service. You agree to provide accurate, current, and complete information during registration and to keep your account credentials secure. You are responsible for all activity that occurs under your account.
          </p>
          <p>
            Access is managed via Microsoft Azure Active Directory (MSAL). Role-based access (Admin, Manager, Staff) is configured by the account owner and controls what features each user can access within your organisation.
          </p>
        </Section>

        <Section title="4. Subscriptions and Billing">
          <p>
            InvenSync is offered on a subscription basis. Fees are billed in advance on a monthly or annual basis as selected. All prices are in Indian Rupees (INR) and are exclusive of applicable taxes.
          </p>
          <p>
            You may upgrade or downgrade your plan at any time. Downgrades take effect at the start of the next billing cycle. We do not provide refunds for unused periods of a subscription.
          </p>
          <p>
            Free trial periods, where offered, automatically convert to a paid subscription at the end of the trial unless cancelled.
          </p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the Service for any unlawful purpose or in violation of any applicable Indian laws</li>
            <li>Upload fraudulent, forged, or manipulated invoices or bills</li>
            <li>Attempt to reverse-engineer, scrape, or extract data from the platform in bulk</li>
            <li>Share account credentials with unauthorised individuals</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
          </ul>
        </Section>

        <Section title="6. AI Features and Accuracy">
          <p>
            InvenSync uses AI to extract data from invoices and bills. While we strive for high accuracy, AI-extracted data may occasionally contain errors. You are responsible for reviewing and verifying all extracted data before it is committed to your inventory.
          </p>
          <p>
            AI-generated purchase order recommendations are advisory only. Final purchasing decisions remain entirely your responsibility.
          </p>
        </Section>

        <Section title="7. Data Ownership">
          <p>
            You retain full ownership of all data you upload to InvenSync, including invoices, product catalogues, vendor records, and financial data. We do not claim any intellectual property rights over your data.
          </p>
          <p>
            By using the Service, you grant Notch Labs a limited, non-exclusive licence to process your data solely to provide and improve the Service.
          </p>
        </Section>

        <Section title="8. Confidentiality">
          <p>
            We treat all business data, financial information, and inventory records you upload as confidential. We do not sell, rent, or share your data with third parties except as required to operate the Service (e.g., cloud infrastructure providers) or as required by law.
          </p>
        </Section>

        <Section title="9. Service Availability">
          <p>
            We aim for high availability but do not guarantee uninterrupted access to the Service. Scheduled maintenance, infrastructure upgrades, or events beyond our control may cause temporary downtime. We will communicate planned maintenance in advance where possible.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, Notch Labs shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of profits, data loss, or business interruption.
          </p>
          <p>
            Our total liability for any claim arising under these Terms shall not exceed the fees you paid to us in the three months preceding the claim.
          </p>
        </Section>

        <Section title="11. Termination">
          <p>
            To cancel your subscription, you must notify us before the <strong className="text-neutral-800">1st of each month</strong>. Our billing cycle runs from the <strong className="text-neutral-800">1st to the 10th of each month</strong>. Cancellation requests received on or after the 1st will take effect at the end of that billing cycle, and you will be charged for the current month.
          </p>
          <p>
            We reserve the right to suspend or terminate your account if you violate these Terms, with or without notice depending on the severity of the violation.
          </p>
          <p>
            Upon termination, you may export your data within 30 days. After this period, your data will be permanently deleted from our systems.
          </p>
        </Section>

        <Section title="12. Changes to Terms">
          <p>
            We may update these Terms from time to time. We will notify you of material changes via email or in-app notification at least 14 days before they take effect. Continued use of the Service after the effective date constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="13. Governing Law">
          <p>
            These Terms are governed by the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of courts in India.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            For questions about these Terms, contact us through the contact form on our website or reach out to our support team directly.
          </p>
        </Section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[13px] text-neutral-400">© 2026 InvenSync · Developed by Notch Labs</p>
          <div className="flex gap-5 text-[13px]">
            <Link to="/privacy" className="text-neutral-500 hover:text-black transition-colors font-medium">Privacy Policy</Link>
            <Link to="/" className="text-neutral-500 hover:text-black transition-colors font-medium">Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
