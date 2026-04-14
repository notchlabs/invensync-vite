import { ApiService } from './common/apiService';
import type { ApiResponse } from '../types/api';

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
}
