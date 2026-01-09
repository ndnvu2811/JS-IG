import React from 'react';
import { InstagramAccount } from '../types';
import { useDashboard } from '../hooks/useDashboard';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import SummaryStats from '../components/dashboard/SummaryStats';
import KanbanBoard from '../components/dashboard/KanbanBoard';
import ActivityDetailDrawer from '../components/dashboard/ActivityDetailDrawer';

interface DashboardProps {
  accounts: InstagramAccount[];
}

const Dashboard: React.FC<DashboardProps> = ({ accounts }) => {
  const {
    selectedAccount,
    setSelectedAccount,
    selectedType,
    setSelectedType,
    todayActivities,
    tomorrowActivities,
    todayStats,
    tomorrowStats,
    selectedActivity,
    isDrawerOpen,
    handleActivityClick,
    handleCloseDrawer,
    today,
    tomorrow,
  } = useDashboard(accounts);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-background-dark overflow-hidden">
      {/* Header with Filters */}
      <DashboardHeader
        accounts={accounts}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />

      {/* Summary Statistics */}
      <SummaryStats
        todayStats={todayStats}
        tomorrowStats={tomorrowStats}
        today={today}
        tomorrow={tomorrow}
      />

      {/* Kanban Board */}
      <KanbanBoard
        todayActivities={todayActivities}
        tomorrowActivities={tomorrowActivities}
        today={today}
        tomorrow={tomorrow}
        onActivityClick={handleActivityClick}
      />

      {/* Activity Detail Drawer */}
      <ActivityDetailDrawer
        activity={selectedActivity}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export default Dashboard;