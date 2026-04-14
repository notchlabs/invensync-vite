import { ApiService } from './common/apiService';
import type { ApiResponse } from '../types/api';

export interface ShiftSummary {
  wbcSale: number;
  totalSale: number;
  wstoreSale: number;
}

export interface MonthlySummaryData {
  wbcSale: number;
  totalSale: number;
  avgPerDay: number;
  totalSalePercentageChange: number;
  avgPerDayPercentageChange: number;
  billedAmount: number;
  nonBilledAmount: number;
  actualBilledAmount: number;
  actualUpiAndCardAmount: number;
  upiAndCardAmount: number;
  cashAmount: number;
  loyalty: number;
  billedDiscrepancy: number;
  upiAndCardDiscrepancy: number;
  wstoreSale: number;
}

export interface MonthlySummary {
  shiftASummary: ShiftSummary;
  shiftBSummary: ShiftSummary;
  monthlySummary: MonthlySummaryData;
}

export interface ConsumptionBucket {
  label: string;
  totalSales: number;
  monthYear: string | null;
  itemsCount: number;
  totalAmountIncTax: number;
  consumptionDate: string;
}

export class SalesService {
  static async fetchMonthlySummary(
    siteId: number,
    year: number,
    month: number
  ): Promise<ApiResponse<MonthlySummary>> {
    return ApiService.get(`/sales/monthly-summary?siteId=${siteId}&year=${year}&month=${month}`);
  }

  static async fetchConsumptionBuckets(
    siteId: number,
    consumptionUnitId: number,
    fromDate: string,
    toDate: string
  ): Promise<ApiResponse<ConsumptionBucket[]>> {
    return ApiService.post('/inbound/storage/fetch-consumption-buckets', {
      siteId,
      consumptionUnitId,
      fromDate,
      toDate,
    });
  }

  static async fetchMonthlyBuckets(
    siteId: number,
    consumptionUnitId: number,
    year: number
  ): Promise<ApiResponse<Record<string, { items: number; total: number }>>> {
    return ApiService.post('/inbound/storage/fetch-monthly-buckets', {
      siteId,
      consumptionUnitId,
      year,
    });
  }
}
