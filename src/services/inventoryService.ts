import type { ApiResponse } from '../types/api';
import type { Vendor, Product, Site, PaginatedData, InventoryItem, InventoryFetchPayload } from '../types/inventory';
import { ApiService } from './common/apiService';

export interface PurchaseRecord {
  unit: string;
  price: number;
  cgstInPerc: number;
  sgstInPerc: number;
  supplierName: string;
  billUrl: string | null;
  refNo: string;
  availableQuantity: number;
  consumedQuantity: number;
  purchasedQty: number;
  purchasedDate: string;
}

export interface SiteDistribution {
  totalSites: number;
  availableQty: number;
  consumedQty: number;
  transitQty: number;
  sites: {
    city: string;
    productId: number;
    availableQty: number;
    consumedQty: number;
    transitQty: number;
    inboundStorageId: number;
    name: string;
    id: number;
    state: string;
  }[];
}

export interface VendorStat {
  id: number;
  supplierName: string;
  address: string;
  gst: string;
  email: string;
  phone: string;
  orders: number;
  orderValue: number;
}

export class InventoryService {
  /**
   * Fetch paginated vendors/suppliers
   */
  static async fetchVendors(page: number, size: number, searchTerm: string = ''): Promise<ApiResponse<PaginatedData<Vendor>>> {
    return ApiService.post(`/supplier/list?page=${page}&size=${size}`, { searchTerm });
  }

  /**
   * Fetch vendor stats (orders, order value)
   */
  static async fetchVendorStats(page: number, size: number, search: string = ''): Promise<ApiResponse<PaginatedData<VendorStat>>> {
    return ApiService.post(`/supplier/list-stats?page=${page}&size=${size}`, { search });
  }

  /**
   * Fetch a single supplier by ID
   */
  static async fetchSupplierById(id: number): Promise<ApiResponse<VendorStat>> {
    return ApiService.get(`/supplier/${id}`);
  }

  /**
   * Fetch paginated products
   */
  static async fetchProducts(page: number, size: number, searchTerm: string = ''): Promise<ApiResponse<PaginatedData<Product>>> {
    return ApiService.post(`/list/products?page=${page}&size=${size}`, { searchTerm });
  }

  /**
   * Fetch paginated sites
   */
  static async fetchSites(page: number, size: number, searchTerm: string = ''): Promise<ApiResponse<PaginatedData<Site>>> {
    return ApiService.post(`/site/fetchAll?page=${page}&size=${size}`, { searchTerm });
  }

  /**
   * Fetch paginated inventory list for main table
   */
  static async fetchInventory(page: number, size: number, payload: InventoryFetchPayload): Promise<ApiResponse<PaginatedData<InventoryItem>>> {
    return ApiService.post(`/list/inventory?page=${page}&size=${size}`, payload);
  }

  /**
   * Helpers to fetch entities by a list of IDs for URL hydration
   */
  static async fetchSitesByIds(ids: number[]) {
    return ApiService.post<ApiResponse<PaginatedData<Site>>>('/site/fetchAll?page=0&size=100', { ids });
  }

  static async fetchProductsByIds(ids: number[]) {
    return ApiService.post<ApiResponse<PaginatedData<Product>>>('/list/products?page=0&size=100', { ids });
  }

  static async fetchVendorsByIds(ids: number[]) {
    return ApiService.post<ApiResponse<PaginatedData<Vendor>>>('/supplier/list?page=0&size=100', { ids });
  }

  /**
   * Fetch storage details (bills) for a specific product and site
   */
  static async fetchInboundStorage(productId: number, siteId: number): Promise<ApiResponse<any[]>> {
    return ApiService.get(`/inbound/storage?productId=${productId}&siteId=${siteId}`);
  }

  /**
   * Fetch audit history for a specific site and product
   */
  static async fetchAuditHistory(page: number, size: number, siteId: number, productId: number): Promise<ApiResponse<PaginatedData<any>>> {
    return ApiService.post(`/list/audits?page=${page}&size=${size}`, { site: siteId, product: productId });
  }

  /**
   * Update product details
   */
  static async updateProduct(productId: number, payload: any): Promise<ApiResponse<any>> {
    return ApiService.post(`/product/${productId}/update`, payload);
  }

  /**
   * Search HSN codes via external ClearTax API
   */
  static async searchHsn(query: string, page: number = 0, size: number = 10): Promise<any> {
    const url = `https://api.clear.in/api/ingestion/config/hsn/v2/search?hsnSearchKey=${encodeURIComponent(query)}&page=${page}&size=${size}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch HSN data');
    return response.json();
  }

  /**
   * Upload an attachment (image)
   */
  static async uploadAttachment(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return ApiService.post('/attachments/upload', formData);
  }

  /**
   * Fetch consumption units for a specific site
   */
  static async fetchConsumptionUnits(siteId: number, searchTerm: string = ''): Promise<ApiResponse<any>> {
    return ApiService.post('/list/consumption-units?page=0&size=100', { siteId, searchTerm });
  }

  /**
   * Fetch the most recent consumption unit ID for a site
   */
  static async fetchRecentConsumptionId(siteId: number): Promise<ApiResponse<number>> {
    return ApiService.get(`/consumption/recent-consumptions?siteId=${siteId}`);
  }

  /**
   * Submit stock consumption
   */
  static async consumeStock(payload: any): Promise<ApiResponse<any>> {
    return ApiService.post('/inbound/storage/consume-stock', payload);
  }

  /**
   * Search for product suggestions and images in the cache
   */
  static async searchProductCache(query: string): Promise<ApiResponse<any>> {
    return ApiService.get(`/product-cache/search?query=${encodeURIComponent(query)}`);
  }

  /**
   * Create a composite product (BOQ)
   */
  static async createCompositeProduct(payload: any): Promise<ApiResponse<any>> {
    return ApiService.post('/product-boq', payload);
  }

  /**
   * Generate a transfer invoice preview (PDF URL)
   */
  static async transferPreview(payload: any): Promise<ApiResponse<string>> {
    return ApiService.post('/invoice/transfer-preview', payload);
  }

  /**
   * Finalize a transfer with full accounting
   */
  static async generateTransferInvoice(payload: any): Promise<ApiResponse<string>> {
    return ApiService.post('/inbound/storage/transfer', payload);
  }

  /**
   * Perform a quick transfer (correction) without full accounting
   */
  static async quickTransfer(payload: any): Promise<ApiResponse<string>> {
    return ApiService.post('/inbound/storage/quick-transfer', payload);
  }

  /**
   * Fetch all purchase history for a product (across all sites)
   */
  static async fetchProductPurchaseHistory(productId: number): Promise<ApiResponse<PurchaseRecord[]>> {
    return ApiService.get(`/inbound/storage?productId=${productId}`);
  }

  /**
   * Fetch site distribution for a specific inbound ID
   */
  static async fetchSiteDistribution(inboundId: number): Promise<ApiResponse<SiteDistribution>> {
    return ApiService.get(`/inbound/storage/fetch-site-distribution?inboundId=${inboundId}`);
  }

  /**
   * Search preparation (BOQ composite) products
   */
  static async searchPreparationProducts(searchTerm: string): Promise<ApiResponse<{ content: PreparationProduct[]; totalElements: number; last: boolean }>> {
    return ApiService.post('/product-boq/search', { searchTerm });
  }
}

export interface PreparationProduct {
  productId: number;
  unit: string;
  amountIncTax: number;
  price: number;
  productName: string;
  productImage: string | null;
}
