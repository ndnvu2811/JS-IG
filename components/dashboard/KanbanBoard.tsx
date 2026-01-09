import React from 'react';
import { DashboardActivity } from '../../hooks/useDashboard';
import ActivityCard from './ActivityCard';
import MaterialSymbol from '../icons/MaterialSymbol';

interface KanbanBoardProps {
  todayActivities: DashboardActivity[];
  tomorrowActivities: DashboardActivity[];
  today: Date;
  tomorrow: Date;
  onActivityClick: (activity: DashboardActivity) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  todayActivities,
  tomorrowActivities,
  today,
  tomorrow,
  onActivityClick,
}) => {
  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const renderColumn = (title: string, date: Date, activities: DashboardActivity[]) => {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Column Header */}
        <div className="bg-gray-800 dark:bg-gray-800 px-4 py-3 rounded-t-lg border-b-2 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(date)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">{activities.length}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">activities</span>
            </div>
          </div>
        </div>

        {/* Column Content - Custom Scrollbar */}
        <div 
            className="flex-1 bg-gray-900 dark:bg-gray-900 p-4 rounded-b-lg border border-gray-700 dark:border-gray-700 border-t-0 overflow-y-auto custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4B5563 #1F2937'
          }}
        >
          {activities.length > 0 ? (
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <ActivityCard
                  key={`${activity.type}-${activity.id}-${index}`}
                  activity={activity}
                  onClick={() => onActivityClick(activity)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <MaterialSymbol icon="inbox" className="text-6xl text-gray-400 dark:text-gray-500 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Activities
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No activities scheduled for this day
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 px-6 pb-6 grid grid-cols-2 gap-4 min-h-0">
      {renderColumn('TODAY', today, todayActivities)}
      {renderColumn('TOMORROW', tomorrow, tomorrowActivities)}
    </div>
  );
};

export default KanbanBoard;