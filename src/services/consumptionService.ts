import { ApiService } from './common/apiService';
import type { ApiResponse } from '../types/api';

export interface Shift {
  id: number;
  consumptionUnitId: number;
  shiftType: string; // 'DAY' | 'NIGHT'
  startTime: string;
  endTime: string;
  wbcSale?: number;
  wstoreSale?: number; // Note: API use lowercase 's'
  totalSale?: number;
  billedAmount?: number;
  nonBilledAmount?: number;
  upiAndCardAmount?: number;
  cashAmount?: number;
  loyalty?: number;
}

export interface BucketItem {
  cuBillId: number;
  productId: number;
  productName: string;
  imageUrl: string;
  vendorNames: string;
  vendorIds: string;
  price: number;
  qty: number;
  consumedByEmail: string;
  unit: string;
  amountIncTax: number;
  loyalty: number;
  cash: number;
  upi: number;
  noBill: number;
}

export interface ExistingSales {
  id: number;
  recordedBilledAmountByManager: number;
  recordedPosAmountByManager: number;
  cashCollectedByManager: number;
  upiCollectedByManager: number;
}

export class ConsumptionService {
  /**
   * Check if sales/audit exists for a specific date and site
   */
  static async existsSalesByDateAndSiteId(date: string, siteId: number): Promise<ApiResponse<ExistingSales | null>> {
    return ApiService.get(`/sales/exists?date=${date}&siteId=${siteId}`);
  }

  /**
   * Fetch shifts timeframes for a given date
   */
  static async fetchShifts(date: string): Promise<ApiResponse<Shift[]>> {
    return ApiService.get(`/sales/fetch-shifts?date=${date}`);
  }

  /**
   * Fetch consumption logic bucket items
   */
  static async fetchBucketItems(payload: { siteId: number; consumptionUnitId: number; fromDate: string; toDate: string; sortDir: string; productName: string }): Promise<ApiResponse<BucketItem[]>> {
    return ApiService.post('/list/fetch-consumptions', payload);
  }

  /**
   * Revert a consumed item
   */
  static async revertConsumedItem(payload: { consumptionUnitId: number; siteId: number }): Promise<ApiResponse<any>> {
    return ApiService.post('/inbound/storage/revert-stock-consumption', payload);
  }

  /**
   * Extract MOP/POS receipt via OCR
   */
  static async extractMposReceipt(file: File): Promise<ApiResponse<{ value: number; message: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return ApiService.post('/product-cache/mpos-receipt/extract', formData);
  }

  /**
   * Save sales progress (without ending shift)
   */
  static async saveSales(payload: any): Promise<ApiResponse<any>> {
    return ApiService.post('/sales/save-consumption', payload);
  }

  /**
   * End shift and finalize
   */
  static async endShift(payload: any): Promise<ApiResponse<any>> {
    return ApiService.post('/sales/end-shift', payload);
  }

  /**
   * Save Manager Audit inputs
   */
  static async saveSalesAudit(salesId: number, payload: { recordedBilledAmountByManager: number; recordedPosAmountByManager: number; cashCollectedByManager: number; upiCollectedByManager: number }): Promise<ApiResponse<any>> {
    return ApiService.post(`/sales/${salesId}/audit`, payload);
  }
}
