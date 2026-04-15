import { useState, useEffect, useCallback, useRef } from 'react'
import { X, FileText, History, ExternalLink, Box, User, Calendar, Tag } from 'lucide-react'
import { InfiniteScrollTable, type Column } from '../common/InfiniteScrollTable'
import { InventoryService, type PurchaseRecord, type AuditLogItem } from '../../services/inventoryService'
import type { InventoryItem } from '../../types/inventory'

interface InventoryDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
}

export function InventoryDetailModal({ isOpen, onClose, item }: InventoryDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'bills' | 'audit'>('bills')
  const [billsData, setBillsData] = useState<PurchaseRecord[]>([])
  const [auditData, setAuditData] = useState<AuditLogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [auditHasMore, setAuditHasMore] = useState(true)
  
  const pageRef = useRef(0)
  const isLoadingRef = useRef(false)
  const balanceRef = useRef(item?.quantity || 0)

  // Fetch Bills (Storage)
  const loadBills = useCallback(async () => {
    if (!item || isLoadingRef.current) return
    isLoadingRef.current = true
    setIsLoading(true)
    try {
      const res = await InventoryService.fetchInboundStorage(item.productId, item.siteId)
      setBillsData(res.data || [])
    } catch (error) {
      console.error('Failed to load storage details', error)
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [item])

  // Fetch Audit History
  const loadAudit = useCallback(async (reset = false) => {
    if (!item || isLoadingRef.current) return
    
    if (reset) {
      pageRef.current = 0
      balanceRef.current = item.quantity
      setAuditHasMore(true)
    }

    isLoadingRef.current = true
    setIsLoading(true)
    try {
      const res = await InventoryService.fetchAuditHistory(pageRef.current, 10, item.siteId, item.productId)
      const newItems = res.data.content || []
      
      // Calculate closing balances
      const processedItems = newItems.map((log: AuditLogItem) => {
        const currentBalance = balanceRef.current
        const isNegative = log.actionType === 'CONSUME' || log.actionType === 'OUTBOUND'
        const change = isNegative ? -log.qty : log.qty
        
        // Update balance for the NEXT item (previous transaction in time)
        balanceRef.current = currentBalance - change
        
        return { ...log, closingBalance: currentBalance }
      })

      setAuditData(prev => reset ? processedItems : [...prev, ...processedItems])
      pageRef.current += 1
      setAuditHasMore(!res.data.last)
    } catch (error) {
      console.error('Failed to load audit history', error)
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [item])

  useEffect(() => {
    if (isOpen && item) {
      if (activeTab === 'bills') loadBills()
      else loadAudit(true)
    }
  }, [isOpen, activeTab, item, loadBills, loadAudit])

  if (!isOpen || !item) return null

  const billColumns: Column<PurchaseRecord>[] = [
    {
      header: 'Bill Ref',
      key: 'refNo',
      width: '30%',
      render: (row) => (
        <a 
          href={row.billUrl ?? undefined}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[13px] font-bold text-blue-500 hover:text-blue-600 transition-colors"
        >
          {row.refNo}
          <ExternalLink size={12} />
        </a>
      )
    },
    {
      header: 'Purchased Date',
      key: 'purchasedDate',
      width: '20%',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-[12px] text-secondary-text font-medium">
          <Calendar size={12} className="opacity-50" />
          {new Date(row.purchasedDate).toLocaleDateString()}
        </div>
      )
    },
    {
      header: 'Available Qty',
      key: 'availableQuantity',
      width: '15%',
      className: 'text-right',
      render: (row) => (
        <div className="text-[13px] font-bold text-primary-text">
          {row.availableQuantity} <span className="text-[11px] text-secondary-text font-medium">{row.unit}</span>
        </div>
      )
    },
    {
      header: 'Vendor',
      key: 'supplierName',
      width: '20%',
      render: (row) => (
        <div className="text-[12px] text-secondary-text truncate max-w-[150px]" title={row.supplierName}>
          {row.supplierName}
        </div>
      )
    },
    {
      header: 'Purchased Rate',
      key: 'price',
      width: '15%',
      className: 'text-right',
      render: (row) => (
        <div className="text-[13px] font-bold text-primary-text">
          ₹{row.price.toFixed(2)}
        </div>
      )
    }
  ]

  const auditColumns: Column<AuditLogItem>[] = [
    {
      header: 'Date',
      key: 'date',
      width: '20%',
      render: (row) => {
        const d = new Date(row.date)
        return (
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-primary-text">
              {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-[11px] text-muted-text">
              {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        )
      }
    },
    {
      header: 'Description',
      key: 'note',
      width: '40%',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="text-[13px] font-bold text-primary-text line-clamp-2" dangerouslySetInnerHTML={{ __html: row.note }} />
          <div className="text-[11px] text-muted-text flex items-center gap-1">
            <User size={10} />
            By {row.user.split('@')[0]}
          </div>
        </div>
      )
    },
    {
      header: 'Qty',
      key: 'qty',
      width: '20%',
      className: 'text-right',
      render: (row) => {
        const isNegative = row.actionType === 'CONSUME' || row.actionType === 'OUTBOUND'
        return (
          <div className={`text-[14px] font-black ${isNegative ? 'text-red-500' : 'text-emerald-500'}`}>
            {isNegative ? '-' : '+'} {row.qty}
          </div>
        )
      }
    },
    {
      header: 'Closing',
      key: 'closingBalance',
      width: '20%',
      className: 'text-right',
      render: (row) => (
        <div className="text-[13px] font-bold text-primary-text">
          {row.closingBalance} <span className="text-[11px] text-secondary-text font-medium">{row.unit}</span>
        </div>
      )
    }
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-card border border-border-main shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-[fadeInUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="p-5 pb-4 bg-header border-b border-border-main flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[18px] font-black text-primary-text tracking-tight flex items-center gap-2">
              <Box className="text-primary-text" size={20} />
              {item.productName}
            </h2>
            <div className="flex items-center gap-3 text-[12px]">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-card border border-border-main rounded text-primary-text font-bold">
                <Tag size={12} className="text-primary-text" />
                Site: <span className="text-secondary-text font-medium">{item.site}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-card border border-border-main rounded text-primary-text font-bold">
                <Box size={12} className="text-primary-text" />
                Total Qty: <span className="text-secondary-text font-medium">{item.quantity} {item.unit}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface border border-transparent hover:border-border-main rounded-lg text-muted-text transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-4 bg-header border-b border-border-main shrink-0">
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex items-center gap-2 px-4 py-3 text-[13px] font-bold border-b-2 transition-all ${
              activeTab === 'bills' 
                ? 'border-primary-text text-primary-text' 
                : 'border-transparent text-secondary-text hover:text-primary-text'
            }`}
          >
            <FileText size={16} className={activeTab === 'bills' ? 'text-primary-text' : 'text-secondary-text'} />
            Bills
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-3 text-[13px] font-bold border-b-2 transition-all ${
              activeTab === 'audit' 
                ? 'border-primary-text text-primary-text' 
                : 'border-transparent text-secondary-text hover:text-primary-text'
            }`}
          >
            <History size={16} className={activeTab === 'audit' ? 'text-primary-text' : 'text-secondary-text'} />
            Audit History
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-surface/30">
          {activeTab === 'bills' ? (
            <InfiniteScrollTable
              data={billsData}
              columns={billColumns}
              isLoading={isLoading}
              hasMore={false}
              onLoadMore={() => {}}
              keyExtractor={(r, i) => `${r.refNo}-${i}`}
              minWidth="750px"
            />
          ) : (
            <InfiniteScrollTable
              data={auditData}
              columns={auditColumns}
              isLoading={isLoading}
              hasMore={auditHasMore}
              onLoadMore={() => loadAudit()}
              keyExtractor={(r) => r.id}
              minWidth="750px"
            />
          )}
        </div>
      </div>
    </div>
  )
}
