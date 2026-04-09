import { ApiService } from './common/apiService';
import type { ApiResponse } from '../types/api';
import type { Vendor, Product, Site, PaginatedData, InventoryItem, InventoryFetchPayload } from '../types/inventory';

export class InventoryService {
  /**
   * Fetch paginated vendors/suppliers
   */
  static async fetchVendors(page: number, size: number, searchTerm: string = ''): Promise<ApiResponse<PaginatedData<Vendor>>> {
    return ApiService.post(`/supplier/list?page=${page}&size=${size}`, { searchTerm });
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
}
