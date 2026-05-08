import { ApiService } from './common/apiService';
import type { ApiResponse } from '../types/api';
import type { PaginatedResponse } from './common/common.types';

export interface DocumentItem {
  id: number;
  fileName: string;
  fileType: string;
  docUrl: string;
  isImportant: boolean;
  size: number;
  fileHash: string;
  createdAt: string;
  createdBy: string;
}

export class DocumentService {
  static async fetchDocuments(
    page: number,
    size: number,
    keyWord: string = ''
  ): Promise<ApiResponse<PaginatedResponse<DocumentItem>>> {
    return ApiService.post(
      `/attachments/fetch?page=${page}&size=${size}`,
      { keyWord }
    );
  }

  static async uploadDocument(file: File): Promise<ApiResponse<{ docUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isImp', 'true');
    return ApiService.post('/attachments/upload', formData);
  }

  static async deleteDocument(id: number): Promise<ApiResponse<string>> {
    return ApiService.delete(`/attachments/delete/${id}`);
  }
}
