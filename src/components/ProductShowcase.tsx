import { useEffect, useRef, useState } from 'react'
import {
  Package, ArrowLeftRight, Upload, MapPin,
  Search, Filter, Download, Plus, CheckCircle,
  Clock, Truck, Edit2, ScanLine, Bot
} from 'lucide-react'

/* ===== Mock Window Shell ===== */
const MockWindow = ({
  title,
  icon: Icon,
  children,
  className = '',
  delay = 0,
  visible = false
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  className?: string
  delay?: number
  visible?: boolean
}) => (
  <div
    className={`mock-window ${className} ${visible ? 'mock-window-visible' : ''}`}
    style={{ transitionDelay: `${delay}s` }}
  >
    {/* Title Bar */}
    <div className="mock-titlebar">
      <div className="mock-dots">
        <span /><span /><span />
      </div>
      <div className="mock-title">
        <Icon size={14} strokeWidth={2} />
        <span>{title}</span>
      </div>
      <div className="mock-dots-spacer" />
    </div>
    {/* Content */}
    <div className="mock-body">
      {children}
    </div>
  </div>
)

/* ===== 1. Inventory Management Mock ===== */
const InventoryMock = () => {
  const products = [
    { name: 'UltraTech Cement 50kg', vendor: 'Reliance Retail Ltd', site: 'WildBean Cafe', qty: '80 Bags', price: '₹348.50', total: '₹27,880' },
    { name: 'JSW Steel TMT Bar 12mm', vendor: 'JSW Steel Dealers', site: 'Office Store', qty: '120 Pcs', price: '₹62.40', total: '₹7,488' },
    { name: 'Asian Paints Tractor Emu.', vendor: 'Asian Paints Dist.', site: 'Singh Fuel Center', qty: '15 Ltrs', price: '₹185.00', total: '₹2,775' },
    { name: 'Havells Wire 2.5mm', vendor: 'Havells India Ltd', site: 'WildBean Cafe', qty: '28 Mtrs', price: '₹24.70', total: '₹691.60' },
    { name: 'Birla A1 Cement PPC', vendor: 'Mishra Enterprises', site: 'Office Store', qty: '43 Bags', price: '₹365.00', total: '₹15,695' },
  ]

  return (
    <>
      <div className="mock-header-row">
        <div>
          <h3 className="mock-page-title">Inventory Management</h3>
          <p className="mock-page-sub">Track and manage your stock across all sites</p>
        </div>
        <div className="mock-actions">
          <button className="mock-btn mock-btn-outline"><ScanLine size={13} /> Consumption</button>
          <button className="mock-btn mock-btn-filled"><Plus size={13} /> Prepare Product</button>
        </div>
      </div>
      <div className="mock-filters">
        <div className="mock-search"><Search size={13} /><span>Search...</span></div>
        <div className="mock-filter-pill"><Filter size={11} /> Select Site(s)</div>
        <div className="mock-filter-pill"><Filter size={11} /> Select Vendor(s)</div>
      </div>
      <p className="mock-count">Showing <strong>10</strong> of <strong>2,939</strong> products</p>
      <div className="mock-table">
        <div className="mock-table-head">
          <span className="mock-col-name">Product Name</span>
          <span className="mock-col-site">Site</span>
          <span className="mock-col-qty">Qty</span>
          <span className="mock-col-price">Price</span>
          <span className="mock-col-total">Total</span>
        </div>
        {products.map((p, i) => (
          <div key={i} className="mock-table-row">
            <span className="mock-col-name">
              <span className="mock-product-thumb" />
              <span>
                <span className="mock-product-name">{p.name} <Edit2 size={10} /></span>
                <span className="mock-product-vendor">{p.vendor}</span>
              </span>
            </span>
            <span className="mock-col-site">{p.site}</span>
            <span className="mock-col-qty"><span className="mock-qty-badge">{p.qty}</span></span>
            <span className="mock-col-price">{p.price}</span>
            <span className="mock-col-total">{p.total}</span>
          </div>
        ))}
      </div>
    </>
  )
}

/* ===== 2. Transit Management Mock ===== */
const TransitMock = () => {
  const transfers = [
    { ref: 'NKS/26-27/237', items: 1, from: 'Office Store', to: 'D2D Maintenance', date: 'Apr 7, 2026', amount: '₹3,465', status: 'transit' },
    { ref: 'NKS/26-27/236', items: 1, from: 'Office Store', to: 'Arogya Hospital', date: 'Apr 5, 2026', amount: '₹1,840.04', status: 'transit' },
    { ref: 'NKS/26-27/235', items: 1, from: 'Office Store', to: 'D2D Maintenance', date: 'Mar 31, 2026', amount: '₹625.40', status: 'transit' },
    { ref: 'NKS/26-27/232', items: 1, from: 'Office Store', to: 'D2D Maintenance', date: 'Aug 9, 2025', amount: '₹1,050.20', status: 'completed' },
    { ref: 'NKS/26-27/231', items: 4, from: 'Office Store', to: 'Hostel Tikilipara', date: 'Mar 25, 2026', amount: '₹3,660.04', status: 'completed' },
  ]

  return (
    <>
      <div className="mock-header-row">
        <div>
          <h3 className="mock-page-title">Transit Management</h3>
          <p className="mock-page-sub">Track inventory transfers between sites</p>
        </div>
        <div className="mock-actions">
          <button className="mock-btn mock-btn-filled"><Download size={13} /> Export</button>
        </div>
      </div>
      <div className="mock-filters">
        <div className="mock-search"><Search size={13} /><span>Enter ref number...</span></div>
        <div className="mock-filter-pill">Source Site(s)</div>
        <div className="mock-filter-pill">Destination Site(s)</div>
      </div>
      <p className="mock-count">Showing <strong>20</strong> of <strong>219</strong> transfers</p>
      <div className="mock-table">
        <div className="mock-table-head">
          <span className="mock-col-ref">Reference</span>
          <span className="mock-col-items">Items</span>
          <span className="mock-col-from">From</span>
          <span className="mock-col-to">To</span>
          <span className="mock-col-date">Date</span>
          <span className="mock-col-amt">Amount</span>
          <span className="mock-col-status">Status</span>
        </div>
        {transfers.map((t, i) => (
          <div key={i} className="mock-table-row">
            <span className="mock-col-ref">{t.ref}</span>
            <span className="mock-col-items"><span className="mock-item-count">{t.items}</span></span>
            <span className="mock-col-from">● {t.from}</span>
            <span className="mock-col-to">● {t.to}</span>
            <span className="mock-col-date">{t.date}</span>
            <span className="mock-col-amt">{t.amount}</span>
            <span className="mock-col-status">
              <span className={`mock-status mock-status-${t.status}`}>
                {t.status === 'transit' ? <><Truck size={10} /> In Transit</> : <><CheckCircle size={10} /> Completed</>}
              </span>
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

/* ===== 3. Add Stock / Upload Mock ===== */
const AddStockMock = () => (
  <div className="mock-addstock-layout">
    <div className="mock-addstock-left">
      <div className="mock-header-row">
        <div>
          <h3 className="mock-page-title">Add Stock</h3>
          <p className="mock-page-sub">Upload bills to automatically extract inventory data</p>
        </div>
      </div>
      <div className="mock-upload-card">
        <div className="mock-upload-header">
          <span><Bot size={14} /> Upload Product Bill</span>
          <span className="mock-ai-badge">AI Powered</span>
        </div>
        <div className="mock-upload-toggle">
          <span className="mock-toggle" />
          <span>Single Invoice Processing</span>
        </div>
        <p className="mock-upload-powered">Powered by <strong>Gemini AI</strong>. Upload receipts — data extracted automatically.</p>
        <div className="mock-upload-dropzone">
          <Upload size={28} strokeWidth={1.5} />
          <span className="mock-upload-text">Upload your bills &amp; invoices</span>
          <span className="mock-upload-hint">Drag and drop or click to select · JPG, PNG, PDF up to 10MB</span>
          <div className="mock-upload-badges">
            <span className="mock-dot-green" /> Secure
            <span className="mock-dot-blue" /> AI Powered
            <span className="mock-dot-purple" /> Auto Extract
          </div>
          <button className="mock-btn mock-btn-filled"><Upload size={13} /> Choose Files</button>
        </div>
      </div>
    </div>
    <div className="mock-addstock-right">
      <div className="mock-recent-header">
        <span className="mock-today-badge">Today <strong>2</strong></span>
        <span className="mock-yesterday-pill">Yesterday</span>
      </div>
      <p className="mock-recent-title">Recently Uploaded Bills</p>
      <p className="mock-recent-sub">Click any entry to review or take action.</p>
      <div className="mock-recent-item">
        <div><strong>SELF-01</strong><br /><span className="mock-recent-meta">Trilochan Dash · Singh Fuel Center</span></div>
        <div className="mock-recent-amount">₹5,664<br /><span className="mock-recent-date">09/04/2026</span></div>
      </div>
      <div className="mock-recent-item">
        <div><strong>SELF-02</strong><br /><span className="mock-recent-meta">Trilochan Dash · Singh Fuel Center</span></div>
        <div className="mock-recent-amount">₹7,801<br /><span className="mock-recent-date">09/04/2026</span></div>
      </div>
    </div>
  </div>
)

/* ===== 4. All Sites Mock ===== */
const AllSitesMock = () => {
  const sites = [
    { name: 'Singh Fuel Center', location: 'Jujomura, Odisha', date: '01 Nov, 2025 –', person: 'Piyush Singh', value: '₹0', status: 'active' },
    { name: 'WildBean Cafe', location: 'Rengali, Odisha', date: '15 Oct, 2025 –', person: 'Sunil Naik', value: '₹2.39 L', status: 'active' },
    { name: 'VIP Guest House', location: 'Northern Division', date: '20 Mar, 2025 –', person: 'Dibya R. Mallick', value: '₹72.58 L', status: 'active' },
    { name: 'Bajamunda Site', location: 'Bajamunda, Odisha', date: '08 Jul, 2025 –', person: 'Dibya R. Mallick', value: '₹14 L', status: 'active' },
    { name: 'Office Store', location: 'Sambalpur, Odisha', date: '08 Jul, 2025 –', person: 'Dibya R. Mallick', value: '₹30.57 L', status: 'active' },
    { name: 'Doctors Colony', location: 'Jharsuguda, Odisha', date: '03 Jan, 2022 – 02 Jul, 2023', person: 'Dibya R. Mallick', value: '₹3.11 L', status: 'completed' },
  ]

  return (
    <>
      <div className="mock-header-row">
        <div>
          <h3 className="mock-page-title">All Sites</h3>
          <p className="mock-page-sub">Manage and monitor all your sites</p>
        </div>
        <button className="mock-btn mock-btn-filled"><Plus size={13} /> Create Site</button>
      </div>
      <div className="mock-filters">
        <div className="mock-search mock-search-wide"><Search size={13} /><span>Search by site name or address...</span></div>
        <div className="mock-filter-pill">All Status</div>
      </div>
      <p className="mock-count">Showing <strong>12</strong> of <strong>18</strong> sites</p>
      <div className="mock-sites-grid">
        {sites.map((s, i) => (
          <div key={i} className="mock-site-card">
            <div className="mock-site-header">
              <strong>{s.name}</strong>
              <span className="mock-site-edit"><Edit2 size={12} /></span>
            </div>
            <div className="mock-site-meta">
              <span><MapPin size={11} /> {s.location}</span>
              <span><Clock size={11} /> {s.date}</span>
            </div>
            <div className="mock-site-footer">
              <span className={`mock-status mock-status-${s.status}`}>
                {s.status === 'active' ? 'In Progress' : 'Completed'}
              </span>
              <span className="mock-site-value">Inventory Value<br /><strong>{s.value}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ===== Main Showcase Component ===== */
const ProductShowcase = () => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visibleWindows, setVisibleWindows] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!sectionRef.current) return
    const windows = sectionRef.current.querySelectorAll('.mock-window')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute('data-index') || '0')
            setVisibleWindows(prev => new Set(prev).add(idx))
          }
        })
      },
      { threshold: 0.15 }
    )

    windows.forEach((w, i) => {
      w.setAttribute('data-index', String(i))
      observer.observe(w)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section className="showcase-section" id="showcase" ref={sectionRef}>
      <div className="showcase-header container">
        <span className="showcase-label">Product Preview</span>
        <h2 className="showcase-title">Everything You Need, <br />In One Dashboard</h2>
        <p className="showcase-subtitle">
          From bill upload to inventory tracking, site management to transit — InvenSync handles it all.
        </p>
      </div>

      <div className="showcase-grid container">
        <MockWindow
          title="Inventory Management"
          icon={Package}
          className="showcase-window showcase-w-inventory"
          delay={0}
          visible={visibleWindows.has(0)}
        >
          <InventoryMock />
        </MockWindow>

        <MockWindow
          title="Add Stock — AI Powered"
          icon={Upload}
          className="showcase-window showcase-w-addstock"
          delay={0.15}
          visible={visibleWindows.has(1)}
        >
          <AddStockMock />
        </MockWindow>

        <MockWindow
          title="Transit Management"
          icon={ArrowLeftRight}
          className="showcase-window showcase-w-transit"
          delay={0.3}
          visible={visibleWindows.has(2)}
        >
          <TransitMock />
        </MockWindow>

        <MockWindow
          title="All Sites"
          icon={MapPin}
          className="showcase-window showcase-w-sites"
          delay={0.45}
          visible={visibleWindows.has(3)}
        >
          <AllSitesMock />
        </MockWindow>
      </div>
    </section>
  )
}

export default ProductShowcase
