import type { ApiResponse } from '../types/api';
import { ApiService } from './common/apiService';

export interface SiteListItem {
  id: number;
  name: string;
  city: string;
  address: string;
  startDate: string | null;
  endDate: string | null;
  state: string;
  status: string;
  managerName: string;
  managerEmail: string | null;
  totalValueIncTax: number;
}

export interface SiteListPayload {
  searchTerm: string;
  status: string;
}

export interface SiteListData {
  content: SiteListItem[];
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

export interface SiteDetail {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: number;
  gpsLat: number;
  gpsLng: number;
  startDate: string | null;
  endDate: string | null;
  projectType: string;
  status: string;
  managerId: number | null;
  managerNames: string[];
  inventoryConsumers: any[];
}

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface SiteCreatePayload {
  id: number | null;
  name: string;
  projectType: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  gpsLat: number | null;
  gpsLng: number | null;
  startDate: string | null;
  endDate: string | null;
  manager: UserPayload[];
  inventoryConsumers: UserPayload[];
}

export interface SiteUpdatePayload {
  id: number;
  name: string;
  projectType: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: number;
  gpsLat: number | null;
  gpsLng: number | null;
  startDate: string | null;
  endDate: string | null;
  manager: UserPayload[];
  inventoryConsumers: UserPayload[];
}

export interface ConsumptionUnit {
  id: number;
  label: string;
  dsrNo: string;
  description: string;
  consumedValue: number;
}

export interface ConsumptionUnitListData {
  content: ConsumptionUnit[];
  totalElements: number;
  last: boolean;
}

export interface CreateConsumptionUnitRecord {
  dsrNo: string;
  label: string;
  description: string;
  quantity: null;
  unit: string;
}

export class SitesService {
  static async listSites(
    page: number,
    size: number,
    payload: SiteListPayload
  ): Promise<ApiResponse<SiteListData>> {
    return ApiService.post(`/list/sites?page=${page}&size=${size}`, payload);
  }

  static async getSiteByName(name: string): Promise<ApiResponse<SiteDetail>> {
    return ApiService.get(`/site/get-by-name?name=${encodeURIComponent(name)}`);
  }

  static async checkExists(name: string): Promise<ApiResponse<boolean>> {
    return ApiService.get(`/site/exists-by-name?name=${encodeURIComponent(name)}`);
  }

  static async createSite(payload: SiteCreatePayload): Promise<ApiResponse<{ id: number }>> {
    return ApiService.post('/site/create', payload);
  }

  static async updateSite(payload: SiteUpdatePayload): Promise<ApiResponse<null>> {
    return ApiService.post('/site/update', payload);
  }

  static async assignManagers(siteId: number, managers: UserPayload[]): Promise<ApiResponse<any>> {
    return ApiService.post(`/site/${siteId}/assign-manager`, managers);
  }

  static async fetchInventoryStats(siteId: number): Promise<ApiResponse<{ totalValue: number; totalConsumptionValue: number }>> {
    return ApiService.post('/stats/inventory-value', { site: [siteId] });
  }

  static async listConsumptionUnits(
    siteId: number,
    searchTerm: string,
    page: number,
    size: number
  ): Promise<ApiResponse<ConsumptionUnitListData>> {
    return ApiService.post(`/list/site/consumption-units?page=${page}&size=${size}`, { siteId, searchTerm });
  }

  static async createConsumptionUnits(
    siteId: number,
    records: CreateConsumptionUnitRecord[]
  ): Promise<ApiResponse<boolean>> {
    return ApiService.post(`/consumption/site/${siteId}/unit`, { records });
  }
}
