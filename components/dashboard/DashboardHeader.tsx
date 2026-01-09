import React from 'react';
import { InstagramAccount } from '../../types';

interface DashboardHeaderProps {
  accounts: InstagramAccount[];
  selectedAccount: string;
  onAccountChange: (accountUsername: string) => void;
  selectedType: 'all' | 'posts' | 'reels' | 'care';
  onTypeChange: (type: 'all' | 'posts' | 'reels' | 'care') => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  accounts,
  selectedAccount,
  onAccountChange,
  selectedType,
  onTypeChange,
}) => {
  return (
    <header className="flex items-center justify-between bg-transparent px-6 py-4">
      {/* Left: Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monitor your activities for today and tomorrow
        </p>
      </div>

      {/* Right: Filters */}
      <div className="flex items-center gap-3">
        {/* Account Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => onAccountChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary min-w-[200px]"
          >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.username}>
                @{account.username}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Activity Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value as 'all' | 'posts' | 'reels' | 'care')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary min-w-[180px]"
          >
            <option value="all">All Activities</option>
            <option value="posts">Posts Only</option>
            <option value="reels">Reels Only</option>
            <option value="care">Care Activities</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;