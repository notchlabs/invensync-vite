import { ApiService } from './common/apiService';
import type { ApiResponse } from '../types/api';
import type { PaginatedResponse } from './common/common.types';

export interface ExtractedProduct {
  name: string;
  price: number;
  quantity: number;
  unit: string;
  hsnCode: number;
  discountPercentage: number;
  cgstInPerc: number;
  sgstInPerc: number;
}

export interface ExtractedVendor {
  name: string;
  address: string;
  gst: string;
}

export interface ExtractedExtractionData {
  vendor: ExtractedVendor | null;
  products: ExtractedProduct[];
  billTotalIncludingTax: number | null;
  invoiceNumber: string | null;
  isInvoiceNumberClear: boolean | null;
  billDate: string | null;
}

export interface UploadBatch {
  id: number;
  supplierName: string;
  refNo: string;
  totalPrice: number;
  state: any;
  siteNames: string;
  createdAt: string;
  billUrl: string;
}

export class StockUploadService {
  /**
   * Extract data from a product invoice via AI
   */
  static async extractInvoice(file: File, reProcess: boolean = false): Promise<ApiResponse<ExtractedExtractionData | null>> {
    const formData = new FormData();
    formData.append('file', file);
    if (reProcess) {
      formData.append('reProcess', 'true');
    }
    // Overriding specific headers for multipart/form-data because ApiService normally sends application/json
    return ApiService.post('/product-cache/invoice/extract', formData, {
      headers: {
         // Avoid setting 'Content-Type': 'multipart/form-data' explicitly in fetch so browser sets boundary automatically
      }
    });
  }

  /**
   * Fetch batches belonging to dates
   */
  static async fetchBatches(payload: { startDate: string; endDate: string }, page: number = 0, size: number = 6): Promise<ApiResponse<PaginatedResponse<UploadBatch>>> {
    return ApiService.post(`/list/batches?page=${page}&size=${size}`, payload);
  }

  /**
   * Verify if a bill is unique or duplicate
   */
  static async verifyBill(payload: ExtractedExtractionData): Promise<ApiResponse<any>> {
    return ApiService.post('/batch/verify-bill', payload);
  }

  /**
   * Search product cache for image
   */
  static async searchProductCache(query: string): Promise<ApiResponse<{
      id: number;
      searchKey: string;
      correctedName: string | null;
      imageUrl: string;
  }>> {
    return ApiService.get(`/product-cache/search?query=${encodeURIComponent(query)}`);
  }

  /**
   * Create a new batch
   */
  static async createBatch(payload: any): Promise<ApiResponse<any>> {
    return ApiService.post('/batch/create', payload);
  }

  /**
   * Fetch batches that are confirmed but not yet inbounded
   */
  static async fetchPendingBatches(): Promise<ApiResponse<any[]>> {
    return ApiService.get('/batch/pending');
  }

  /**
   * Fetch inbound line items for a specific batch
   */
  static async fetchInbounds(batchId: string | number): Promise<ApiResponse<any[]>> {
    return ApiService.get(`/inbound/fetch?batchId=${batchId}`);
  }
}
