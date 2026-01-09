import React from 'react';
import { DashboardActivity } from '../../hooks/useDashboard';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ActivityCardProps {
  activity: DashboardActivity;
  onClick: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onClick }) => {
  const statusConfig = getStatusConfig(activity.status);
  const typeIcon = getTypeIcon(activity.type);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-primary dark:hover:border-primary transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        {/* Time */}
        <div className="flex items-center gap-1.5 min-w-[70px]">
          <MaterialSymbol icon="schedule" className="text-base text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {activity.time}
          </span>
        </div>

        {/* Account */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <MaterialSymbol icon="person" className="text-base text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            @{activity.account}
          </span>
        </div>

        {/* Type Badge */}
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
          <MaterialSymbol icon={typeIcon} className="text-sm text-gray-600 dark:text-gray-300" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {activity.type}
          </span>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bg}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.badge}`}></div>
          <span className={`text-xs font-semibold ${statusConfig.text}`}>
            {activity.status}
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper: Get type icon
const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    Post: 'grid_view',
    Reel: 'play_circle',
    Care: 'spa',
  };
  return icons[type] || 'help';
};

// Helper: Get status config
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

export default ActivityCard;