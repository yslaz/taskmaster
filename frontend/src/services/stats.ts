import { apiClient } from './api';

export interface TaskStats {
  total_tasks: number;
  tasks_by_status: Record<string, number>;
  tasks_by_priority: Record<string, number>;
  completion_rate: number;
  period_summary: PeriodSummary;
  time_series: TimeSeries;
  overdue_tasks: number;
  due_today: number;
  due_this_week: number;
}

export interface PeriodSummary {
  period: string;
  from_date?: string;
  to_date?: string;
  tasks_created: number;
  tasks_completed: number;
  tasks_updated: number;
}

export interface TimeSeries {
  labels: string[];
  created: number[];
  completed: number[];
  updated: number[];
}

export interface StatsQuery {
  period?: 'day' | 'week' | 'month' | 'year';
  from_date?: string;
  to_date?: string;
}

class StatsService {
  // For general statistics without filters
  async getGeneralStats(): Promise<TaskStats> {
    console.log('StatsService: Making request to /statistics');
    try {
      const response = await apiClient.get<TaskStats>('/statistics');
      console.log('StatsService: Response received:', response);
      return response;
    } catch (error) {
      console.error('StatsService: Error in getGeneralStats:', error);
      throw error;
    }
  }

  // For Analytics - with filters and granularity
  async getAnalyticsStats(params: StatsQuery): Promise<TaskStats> {
    const searchParams = new URLSearchParams();
    
    if (params.period) {
      searchParams.append('period', params.period);
    }
    if (params.from_date) {
      searchParams.append('from_date', params.from_date);
    }
    if (params.to_date) {
      searchParams.append('to_date', params.to_date);
    }

    const query = searchParams.toString();
    const url = query ? `/statistics?${query}` : '/statistics';
    
    const response = await apiClient.get<TaskStats>(url);
    return response;
  }
}

export default new StatsService();
