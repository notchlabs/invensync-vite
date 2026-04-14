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
  state: string;
  siteNames: string;
  createdAt: string;
  billUrl: string;
}

export interface DuplicateInfo {
  id: number;
  supplierName: string;
  refNo: string;
  createdAt: string;
  billUrl: string;
}

export interface CreateBatchPayload {
  vendor: {
    name: string;
    gst: string | null;
    email: string;
    phone: string;
    address: string;
    billTotalIncludingTax: number | null;
    invoiceNumber: string | null;
    isInvoiceNumberClear: boolean | null;
    billDate: string | null;
  };
  totalWithoutTax: string;
  tax: string;
  billTotalIncludingTax: number | null;
  extraCharges: Record<string, unknown>;
  products: {
    name: string;
    quantity: number;
    unit: string;
    hsnCode: number | null;
    hsnName: string | null;
    cgstInPerc: number;
    sgstInPerc: number;
    price: number;
    totalExcludingTax: number;
    tax: number;
    totalIncludingTax: number;
    imageUrl: string | null;
    productId?: number;
  }[];
  invoiceNumber: string | null;
  isInvoiceNumberClear: boolean | null;
  billDate: string | null;
  totalWithTax: string;
  totalIncAll: string;
  billUrl: string;
}

export interface PendingBatch {
  id: number;
  supplierNames: string;
  refNo: string;
  billDate: string;
  billUrl: string;
  createdAt: string;
}

export interface InboundItem {
  batchId: number;
  supplierNames: string;
  refNumber: string;
  billDate: string;
  billUrl: string;
  productId: number;
  productName: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  unit: string;
  tax: number;
  totalExcTax: number;
  totalIncTax: number;
  inboundId: number;
}

export interface InboundMaterialPayload {
  destinationSiteId: number;
  destinationSiteName: string;
  productId: number;
  productName: string;
  quantity: number;
  inboundId: number;
}

export interface BatchDetail {
  id: number;
  supplierId: number;
  supplierName: string;
  billUrl: string;
  billDate: string;
  refNumber: string;
  uniqueId: string;
  totalAmount: number;
  totalAmountIncTax: number;
  totalItems: number;
  createdAt: string;
  createdBy: string;
  siteTransferred: string[];
  uploadDays: number;
}

export interface BatchDetailsPayload {
  searchKey: string | null;
  vendor: number[];
  startDate: string | null;
  endDate: string | null;
  createdStartDate: string | null;
  createdEndDate: string | null;
  site: number[];
}

export interface BatchInvoiceDetail {
  vendor: {
    name: string;
    gst: string;
    email: string | null;
    phone: string;
    address: string;
  };
  totalWithoutTax: number;
  tax: number;
  totalWithTax: number;
  totalIncAll: number | null;
  extraCharges: Record<string, unknown>;
  products: {
    hsnCode: number;
    tax: number;
    hsnName: string;
    unit: string;
    price: number;
    inboundId: number;
    cgstInPerc: number;
    sgstInPerc: number;
    quantity: number;
    totalIncludingTax: number;
    totalWithoutTax: number;
    productUrl: string;
    name: string;
  }[];
  supportingDocs: string[];
  invoiceNumber: string;
  billDate: string;
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
  static async verifyBill(payload: ExtractedExtractionData): Promise<ApiResponse<DuplicateInfo | null>> {
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
  static async createBatch(payload: CreateBatchPayload): Promise<ApiResponse<{ id: number }>> {
    return ApiService.post('/batch/create', payload);
  }

  /**
   * Fetch batches that are confirmed but not yet inbounded
   */
  static async fetchPendingBatches(): Promise<ApiResponse<PendingBatch[]>> {
    return ApiService.get('/batch/pending');
  }

  /**
   * Fetch inbound line items for a specific batch
   */
  static async fetchInbounds(batchId: string | number): Promise<ApiResponse<InboundItem[]>> {
    return ApiService.get(`/inbound/fetch?batchId=${batchId}`);
  }

  /**
   * Delete a pending batch
   */
  static async deleteBatch(batchId: string | number): Promise<ApiResponse<{ message: string }>> {
    return ApiService.delete(`/batch/delete/${batchId}`);
  }

  /**
   * Submit inbound material to a specific site
   */
  static async inboundMaterial(payload: InboundMaterialPayload[]): Promise<ApiResponse<{ message: string }>> {
    return ApiService.post('/inbound/storage/inbound', payload);
  }

  /**
   * Fetch detailed batch information with filters
   */
  static async fetchBatchDetails(page: number, size: number, payload: BatchDetailsPayload): Promise<ApiResponse<PaginatedResponse<BatchDetail>>> {
    return ApiService.post(`/list/batch-details?page=${page}&size=${size}`, payload);
  }

  /**
   * Fetch a single batch by ID with full details
   */
  static async fetchBatchById(id: number | string): Promise<ApiResponse<BatchInvoiceDetail>> {
    return ApiService.get(`/batch/${id}`);
  }
}
