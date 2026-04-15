import { ApiService } from './common/apiService';
import type { ApiResponse } from '../types/api';
import type { PaginatedResponse } from './common/common.types';

export interface TransferRecord {
  id: number;
  refNumber: string;
  billDate: string;
  billUrl: string;
  sourceSite: string;
  destinationSite: string;
  totalAmount: number;
  totalAmountIncTax: number;
  totalItems: number;
  status: string;
  createdBy?: string;
}

export interface TransferListPayload {
  search: string;
  fromDate: string;
  toDate: string;
  fromSiteId: number[] | null;
  toSiteId: number[] | null;
}

export interface TransferItem {
  id: number;
  transferBatchId: number;
  productId: number;
  inboundStorageId: number;
  transferredQty: number;
  qty: number;
  productName: string;
  unit: string;
  pricePerUnit: number;
  cgstInPerc: number;
  sgstInPerc: number;
  billUrl: string;
  refNumber: string;
  supplierName: string;
}

export class TransferService {
  static async fetchTransfers(
    page: number,
    size: number,
    payload: TransferListPayload
  ): Promise<ApiResponse<PaginatedResponse<TransferRecord>>> {
    return ApiService.post(`/list/transfers?page=${page}&size=${size}`, payload);
  }

  static async fetchTransferItems(id: number): Promise<ApiResponse<TransferItem[]>> {
    return ApiService.get(`/transfer/${id}/items`);
  }

  static async rejectTransfer(id: number): Promise<ApiResponse<unknown>> {
    return ApiService.delete(`/inbound/storage/${id}/reject-transfer`);
  }

  static async markAsReceived(id: number): Promise<ApiResponse<unknown>> {
    return ApiService.put(`/inbound/storage/transfer/${id}/mark-as-received`, {});
  }
}
