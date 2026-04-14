import { ApiService } from './common/apiService';
import type { ApiResponse } from '../types/api';

export interface ExtractedProduct {
  refNo: string
  name: string
  lotQty: number
}

export interface ExtractResponse {
  products: ExtractedProduct[]
}

export interface POOrderItem {
  refNo: string
  name: string
  qtyToOrder: number
  packets: number
  lotSize: number
}

export interface GeneratePOResponse {
  analysis: string
  recommended_changes: POOrderItem[]
}

export interface GeneratePOPayload {
  supplierIds: number[]
  minOrderValue: number
  products: ExtractedProduct[]
  type: 'INVOICE_BILL' | 'STOCK_REPORT'
}

export class PurchaseOrderService {
  /**
   * Extract products from a supplier stock-list image/file
   */
  static async extractStockList(file: File): Promise<ApiResponse<ExtractResponse>> {
    const formData = new FormData()
    formData.append('file', file)
    return ApiService.post('/product-cache/stock-list/extract', formData)
  }

  /**
   * Generate an AI-optimised purchase order
   */
  static async generatePO(payload: GeneratePOPayload): Promise<ApiResponse<GeneratePOResponse>> {
    return ApiService.post('/ai/purchase/generate-po', payload)
  }
}
