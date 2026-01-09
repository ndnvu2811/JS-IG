import React from 'react';
import { InstagramAccount, CareSettings } from '../../types';

interface OverviewDetail {
  title: string;
  summary: string;
  totalTime: number;
  accounts: InstagramAccount[];
  type: 'info' | 'warning';
}

interface ActivityOverviewProps {
  details: OverviewDetail[];
  totalTime: number;
}

const ActivityOverview: React.FC<ActivityOverviewProps> = ({ details, totalTime }) => {
  if (details.length === 0) {
    return <p className="text-sm text-gray-500 italic">No activities enabled.</p>;
  }

  return (
    <>
      {details.map((detail, index) => (
        <div
        key={index}
        className="mb-4"
        >
          <h4 className="text-base font-medium text-white mb-2">{detail.title}</h4>
          
          {detail.accounts.length > 0 && (
            <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
              {detail.accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full flex-shrink-0"
                >
                  <img src={acc.avatarUrl} alt={acc.username} className="w-5 h-5 rounded-full" />
                  <span className="text-sm text-gray-300 whitespace-nowrap">{acc.username}</span>
                </div>
              ))}
            </div>
          )}
          
          <p className="text-sm text-gray-400">{detail.summary}</p>
          
          {detail.totalTime > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Time: <span className="text-purple-400 font-medium">{detail.totalTime}s</span>
            </p>
          )}
        </div>
      ))}
    </>
  );
};
export default ActivityOverview;