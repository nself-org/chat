/**
 * POST /api/analytics/export
 *
 * Exports analytics data in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsAggregator } from '@/lib/analytics/analytics-aggregator';
import type {
  AnalyticsFilters,
  ExportFormat,
  AnalyticsSectionType,
} from '@/lib/analytics/analytics-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      format = 'csv',
      sections = ['summary'],
      dateRange,
      granularity = 'day',
      fileName,
    } = body as {
      format: ExportFormat;
      sections: AnalyticsSectionType[];
      dateRange: { start: string; end: string };
      granularity: 'hour' | 'day' | 'week' | 'month' | 'year';
      fileName?: string;
    };

    // Build filters
    const aggregator = getAnalyticsAggregator();
    const filters: AnalyticsFilters = {
      dateRange: {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      },
      granularity,
    };

    // Fetch data
    const dashboardData = await aggregator.aggregateDashboardData(filters);

    // For now, return JSON (implement CSV/PDF/XLSX generation later)
    const exportData = {
      fileName: fileName || `analytics-export-${Date.now()}.${format}`,
      format,
      sections,
      dateRange,
      data: dashboardData,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      export: exportData,
      downloadUrl: '/api/analytics/download/' + exportData.fileName,
    });
  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
