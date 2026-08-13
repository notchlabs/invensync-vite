import { ApiService } from './common/apiService';
import type { ApiResponse } from '../types/api';
import type { PaginatedResponse } from './common/common.types';

export interface StatItem {
  amount: number;
  percentageChange: number;
  comparisonType: string;
  trend: 'UP' | 'DOWN';
}

export interface InventoryStats {
  todayConsumption: StatItem;
  consumptionTillDate: StatItem;
  projectedConsumption: StatItem;
  projectedSales: StatItem;
}

export interface ProfitLossMonth {
  monthLabel: string;
  year: number;
  month: number;
  consumption: number;
  sales: number;
  toleranceValue: number;
  amount: number;
  profit: boolean;
  finalized: boolean;
  cash: number;
  cashCollectedByManager: number;
  paytm: number;
  paytmCheckedByManager: number;
}

export interface MonthlyExpensesData {
  expenses: Record<string, number>;
}

export interface FinancialSummary {
  capital: { fixed: number; working: number; total: number }
  running: { currentMonthExpense: number }
  burn: { monthlyAverage: number }
  recovery: { recoveredAmount: number }
  breakEven: { percentRecovered: number; monthsRemaining: number }
}

export class ReportService {
  static async fetchInventoryStats(siteId: number, cuId: number): Promise<ApiResponse<InventoryStats>> {
    return ApiService.get(`/report/inventory-stats?siteId=${siteId}&cuId=${cuId}`);
  }

  static async fetchProfitLossOverview(siteId: number): Promise<ApiResponse<ProfitLossMonth[]>> {
    return ApiService.get(`/report/profit-loss-overview?siteId=${siteId}`);
  }

  static async fetchMonthlyExpenses(siteId: number, month: number, year: number): Promise<ApiResponse<MonthlyExpensesData>> {
    return ApiService.get(`/report/monthly-expenses?month=${month}&year=${year}&siteId=${siteId}`);
  }

  static async fetchFinancialSummary(siteId: number): Promise<ApiResponse<FinancialSummary>> {
    return ApiService.get('/report/financial-summary?siteId=' + siteId);
  }

  static async finalizeMonth(siteId: number, year: number, month: number): Promise<ApiResponse<ProfitLossMonth>> {
    return ApiService.post(`/report/profit-loss-overview/finalize?siteId=${siteId}&year=${year}&month=${month}`, {});
  }

  static async fetchConsumptionReport(
    page: number,
    size: number,
    payload: ConsumptionReportPayload,
  ): Promise<ApiResponse<{ data: PaginatedResponse<ConsumptionReportItem>; summary: ConsumptionReportSummary | null }>> {
    return ApiService.post(`/list/consumption-report?page=${page}&size=${size}`, payload);
  }

  static async fetchProductWiseProfitReport(
    payload: ProductProfitReportPayload
  ): Promise<ApiResponse<PaginatedResponse<ProductProfitReportItem>>> {
    return ApiService.post('/profit/product-wise?page=0&size=1000', payload);
  }

  static async fetchVendorWiseProfitReport(
    payload: VendorProfitReportPayload
  ): Promise<ApiResponse<PaginatedResponse<VendorProfitReportItem>>> {
    return ApiService.post('/profit/vendor-wise?page=0&size=1000', payload);
  }
}

export type StockStatus = 'ALL' | 'SAFE' | 'ORDER_SOON' | 'CRITICAL'

export interface ConsumptionReportPayload {
  searchTerm: string
  stockStatus: StockStatus
  sortBy: string
  sortDir: 'ASC' | 'DESC'
  vendorIds?: number[]
}

export interface ConsumptionReportItem {
  productId: number
  productName: string
  supplierName: string | null
  imageUrl: string | null
  unit: string
  consumptionRate: number
  stock: number
  daysLeft: number | null
  stockStatus: string
}

export interface ConsumptionReportSummary {
  productsShown: number
  avgDaily: number
  belowReorder: number
  critical: number
}

export interface ProductProfitReportPayload {
  siteId: number
  fromDate?: string
  toDate?: string
  searchTerm?: string
  sortBy?: 'PROFIT' | 'SALE_AMOUNT' | 'PURCHASE_AMOUNT'
  sortDir?: 'ASC' | 'DESC'
}

export interface ProductProfitReportItem {
  productId: number
  productName: string
  unit: string
  imageUrl: string | null
  totalSaleAmount: number
  totalPurchaseAmount: number
  totalProfit: number
  profitPercentage: number
  transactionCount: number
}

export interface VendorProfitReportPayload {
  siteId: number
  fromDate?: string
  toDate?: string
  searchTerm?: string
  sortBy?: 'PROFIT' | 'SALE_AMOUNT' | 'PURCHASE_AMOUNT'
  sortDir?: 'ASC' | 'DESC'
}

export interface VendorProfitReportItem {
  supplierId: number
  supplierName: string
  supplierAddress: string
  totalSaleAmount: number
  totalPurchaseAmount: number
  totalProfit: number
  profitPercentage: number
  productCount: number
  transactionCount: number
}


