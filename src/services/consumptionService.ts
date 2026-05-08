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

export interface SalesProductDetail {
  itemId: number;
  productId: number;
  amountIncTax: number;
  isWbc: boolean;
  qty: number;
  cash: number;
  upi: number;
  noBill: number;
  loyalty: number;
  total: number;
}

export interface SaveSalesPayload {
  siteId: number;
  consumptionUnitId: number;
  date: string;
  productDetails: SalesProductDetail[];
}

export interface SalesAuditPayload {
  recordedBilledAmountByManager: number;
  recordedPosAmountByManager: number;
  cashCollectedByManager: number;
  upiCollectedByManager: number;
}

export interface RealTimeConsumePayload {
  consumptionUnitId: number;
  consumptionDate: string;
  saveDetails: boolean;
  records: {
    sourceSiteId: number;
    productId: number;
    productName: string;
    quantity: number;
    amountIncTax: number;
    upi: number;
    cash: number;
    noBill: boolean;
    loyalty: boolean;
  }[];
}

export interface PrepareAndConsumePayload {
  compositeProductId: number;
  siteId: number;
  quantityToPrepare: number;
  consumptionUnitId: number | null;
  rawMaterials: {
    name: string;
    requiredPerUnit: number;
    unit: string;
    availableQty: number;
    consumeQty: number;
    productId: number;
  }[];
  extraCharges: Record<string, { value: number; taxable: boolean }>;
  consumptionDate: string;
  saveDetails: boolean;
  amountIncTax: number;
  cash: number;
  upi: number;
  loyalty: boolean;
  noBill: boolean;
  isWbc: boolean;
}

export interface BucketItem {
  cuBillId: number;
  productId: number;
  productName: string;
  imageUrl: string;
  vendorNames: string;
  vendorIds: string;
  price: number;
  tax: number;
  qty: number;
  consumedByEmail: string;
  unit: string;
  amountIncTax: number;
  loyalty: number;
  cash: number;
  upi: number;
  noBill: number;
  consumedDate?: string;
}

export interface ExistingSales {
  id: number;
  recordedBilledAmountByManager: number;
  recordedPosAmountByManager: number;
  cashCollectedByManager: number;
  upiCollectedByManager: number;
  createdAt?: string;
}

export interface ConsumptionUnitInfo {
  name: string;
  description: string | null;
  siteId: number;
  managerName: string;
  uniqueId: string;
  unitId: number;
  siteName: string;
}

export class ConsumptionService {
  /**
   * Fetch consumption unit info by site name and DSR number
   */
  static async fetchBySiteNameAndDsr(siteName: string, dsrNo: string): Promise<ApiResponse<ConsumptionUnitInfo>> {
    return ApiService.post('/consumption/fetch-by-site-name-and-dsr', { siteName, dsrNo });
  }

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
  static async revertConsumedItem(payload: { consumptionUnitId: number; siteId: number }): Promise<ApiResponse<null>> {
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
  static async saveSales(payload: SaveSalesPayload): Promise<ApiResponse<null>> {
    return ApiService.post('/sales/save-consumption', payload);
  }

  /**
   * End shift and finalize
   */
  static async endShift(payload: SaveSalesPayload): Promise<ApiResponse<number>> {
    return ApiService.post('/sales/end-shift', payload);
  }

  /**
   * Save Manager Audit inputs
   */
  static async saveSalesAudit(salesId: number, payload: SalesAuditPayload): Promise<ApiResponse<null>> {
    return ApiService.post(`/sales/${salesId}/audit`, payload);
  }

  /**
   * Consume real-time stock
   */
  static async consumeStock(payload: RealTimeConsumePayload): Promise<ApiResponse<null>> {
    return ApiService.post('/inbound/storage/consume-stock', payload);
  }

  static async prepareAndConsume(payload: PrepareAndConsumePayload): Promise<ApiResponse<null>> {
    return ApiService.post('/product-boq/prepare-and-consume', payload);
  }
}
