import React from 'react';
import { DashboardStats } from '../../hooks/useDashboard';
import MaterialSymbol from '../icons/MaterialSymbol';

interface SummaryStatsProps {
  todayStats: DashboardStats;
  tomorrowStats: DashboardStats;
  today: Date;
  tomorrow: Date;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({
  todayStats,
  tomorrowStats,
  today,
  tomorrow,
}) => {
  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const calculatePercentage = (count: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const getTotalActivities = (stats: DashboardStats): number => {
    return stats.totalPosts + stats.totalReels + stats.totalCare;
  };

  const renderStatsCard = (title: string, date: Date, stats: DashboardStats) => {
    const total = getTotalActivities(stats);
    const statusEntries = Object.entries(stats.statusBreakdown).filter(([_, count]) => count > 0);

    return (
      <div className="flex-1 bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(date)}</p>
          </div>
          <div className="text-3xl font-bold text-primary">{total}</div>
        </div>

        {/* Activity Counts */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MaterialSymbol icon="grid_view" className="text-lg text-blue-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalPosts}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MaterialSymbol icon="play_circle" className="text-lg text-purple-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalReels}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Reels</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MaterialSymbol icon="spa" className="text-lg text-green-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalCare}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Care</p>
          </div>
        </div>

        {/* Status Breakdown with Progress Bars */}
        {total > 0 && (
          <div className="space-y-3">
            <div className="border-t border-gray-200 dark:border-border-dark pt-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">
                Status Breakdown
              </p>
            </div>

            {statusEntries.map(([status, count], index) => {
            const percentage = calculatePercentage(count, total);
            const statusConfig = getStatusConfig(status);

            return (
              <div key={`${title}-${status}-${index}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusConfig.badge}`}></div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {status}
                      </span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 font-semibold">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${statusConfig.badge} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {total === 0 && (
          <div className="text-center py-8">
            <MaterialSymbol icon="inbox" className="text-4xl text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No activities scheduled</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="px-6 pb-4">
  <div className="grid grid-cols-2 gap-4">
      {renderStatsCard('TODAY', today, todayStats)}
      {renderStatsCard('TOMORROW', tomorrow, tomorrowStats)}
    </div>
  </div>
  );
};

// Helper function for status colors
const getStatusConfig = (status: string) => {
  const configs: Record<string, { badge: string; bg: string; text: string }> = {
    Posted: {
      badge: 'bg-green-500',
      bg: 'bg-green-500/20',
      text: 'text-green-700 dark:text-green-400',
    },
    Scheduled: {
      badge: 'bg-blue-500',
      bg: 'bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
    },
    Posting: {
      badge: 'bg-yellow-500',
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-700 dark:text-yellow-400',
    },
    Failed: {
      badge: 'bg-red-500',
      bg: 'bg-red-500/20',
      text: 'text-red-700 dark:text-red-400',
    },
    Missed: {
      badge: 'bg-gray-500',
      bg: 'bg-gray-500/20',
      text: 'text-gray-700 dark:text-gray-400',
    },
    Draft: {
      badge: 'bg-purple-500',
      bg: 'bg-purple-500/20',
      text: 'text-purple-700 dark:text-purple-400',
    },
    Completed: {
      badge: 'bg-green-500',
      bg: 'bg-green-500/20',
      text: 'text-green-700 dark:text-green-400',
    },
  };

  return configs[status] || configs.Scheduled;
};

export default SummaryStats;