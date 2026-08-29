// ── Credit Customer Service ───────────────────────────────────────────────────

import { ApiService } from './common/apiService'
import { ENV } from '../config/env'
import type { ApiResponse } from '../types/api'

export interface CreditCustomer {
  id: string
  name: string
  phone: string
  totalLoyaltyConsumed: number
  creditBalance: number
  lastTransactionDate: string
  createdAt?: string
}

export interface CreditTransaction {
  id: string
  customerId: string
  customerName: string
  amount: number
  paymentMode: 'Loyalty' | 'Cash' | 'UPI'
  type: 'CONSUMPTION_CREDIT' | 'PAYMENT_SETTLEMENT'
  notes?: string
  inboundConsumptionUnitId?: number
  productName?: string
  unit?: string
  qty?: number
  date: string
}

export class CreditCustomerService {
  private static cachedCustomers: CreditCustomer[] = []

  static getCustomers(): CreditCustomer[] {
    return this.cachedCustomers
  }

  static async fetchCustomersFromApi(siteId?: number): Promise<CreditCustomer[]> {
    try {
      const sid = siteId || Number(ENV.DEFAULT_SITE_ID)
      const res = await ApiService.get<ApiResponse<any[]>>(`/credit-customers/fetch?siteId=${sid}`)
      if (res.success && Array.isArray(res.data)) {
        const mapped: CreditCustomer[] = res.data.map(item => ({
          id: String(item.id),
          name: item.name,
          phone: item.phone || '',
          totalLoyaltyConsumed: Number(item.totalLoyaltyConsumed || 0),
          creditBalance: Number(item.creditBalance || 0),
          lastTransactionDate: item.lastTransactionDate || new Date().toISOString(),
          createdAt: item.createdAt || new Date().toISOString(),
        }))
        this.cachedCustomers = mapped
        return mapped
      }
    } catch (err) {
      console.warn('API fetch error for credit customers:', err)
    }
    return this.cachedCustomers
  }

  static async fetchTransactionsFromApi(customerId: string): Promise<CreditTransaction[]> {
    const numericId = Number(customerId)
    if (isNaN(numericId)) return []
    try {
      const res = await ApiService.get<ApiResponse<any[]>>(`/credit-customers/${numericId}/transactions`)
      if (res.success && Array.isArray(res.data)) {
        const mapped: CreditTransaction[] = res.data.map(item => ({
          id: String(item.id),
          customerId: String(item.customerId),
          customerName: item.customerName || '',
          amount: Number(item.amount || 0),
          paymentMode: (item.paymentMode === 'CASH' ? 'Cash' : item.paymentMode === 'UPI' ? 'UPI' : 'Loyalty'),
          type: item.type === 'PAYMENT_SETTLEMENT' ? 'PAYMENT_SETTLEMENT' : 'CONSUMPTION_CREDIT',
          notes: item.notes || '',
          inboundConsumptionUnitId: item.inboundConsumptionUnitId,
          productName: item.productName || undefined,
          unit: item.unit || undefined,
          qty: item.qty ? Number(item.qty) : undefined,
          date: item.createdDate || new Date().toISOString(),
        }))
        return mapped
      }
    } catch (err) {
      console.warn('API fetch error for transactions:', err)
    }
    return []
  }

  static async addCustomer(name: string, phone: string, initialCredit = 0): Promise<CreditCustomer | null> {
    try {
      const res = await ApiService.post<ApiResponse<any>>('/credit-customers/create', {
        siteId: Number(ENV.DEFAULT_SITE_ID),
        name: name.trim(),
        phone: phone.trim(),
        initialCredit,
      })

      if (res.success && res.data) {
        await this.fetchCustomersFromApi()
        const newId = String(res.data.id || res.data)
        return this.cachedCustomers.find(c => c.id === newId) || null
      }
    } catch (err) {
      console.error('Failed to create credit customer via API:', err)
    }
    return null
  }

  static async recordLoyaltyCredit(
    customerId: string,
    amount: number,
    notes?: string,
    inboundConsumptionUnitId?: number
  ): Promise<boolean> {
    const numericId = Number(customerId)
    try {
      const target = this.cachedCustomers.find(c => c.id === customerId)
      const res = await ApiService.post<ApiResponse<any>>('/credit-customers/loyalty-credit', {
        customerId: isNaN(numericId) ? null : numericId,
        customerName: target?.name || customerId,
        siteId: Number(ENV.DEFAULT_SITE_ID),
        amount,
        notes,
        inboundConsumptionUnitId,
      })

      if (res.success) {
        await this.fetchCustomersFromApi()
        return true
      }
    } catch (err) {
      console.error('Failed to record loyalty credit via API:', err)
    }
    return false
  }

  static async settleBalance(
    customerId: string,
    amount: number,
    paymentMode: 'Cash' | 'UPI' = 'UPI',
    notes?: string,
    inboundConsumptionUnitId?: number,
    clearingDate?: string,
    transactionIds?: string[]
  ): Promise<boolean> {
    const numericId = Number(customerId)
    if (isNaN(numericId)) return false
    try {
      const res = await ApiService.post<ApiResponse<any>>('/credit-customers/settle', {
        customerId: numericId,
        amount,
        paymentMode,
        notes,
        inboundConsumptionUnitId,
        clearingDate: clearingDate || new Date().toISOString(),
        transactionIds: transactionIds && transactionIds.length > 0 ? transactionIds.map(Number) : undefined,
      })

      if (res.success) {
        await this.fetchCustomersFromApi()
        return true
      }
    } catch (err) {
      console.error('Failed to settle balance via API:', err)
    }
    return false
  }

  static clearLocalCache(): void {
    this.cachedCustomers = []
  }
}
