import React from 'react';
import { DashboardActivity } from '../../hooks/useDashboard';
import MaterialSymbol from '../icons/MaterialSymbol';
import { getMediaUrl } from '../../utils/mediaUtils';

interface ActivityDetailDrawerProps {
  activity: DashboardActivity | null;
  isOpen: boolean;
  onClose: () => void;
}

const ActivityDetailDrawer: React.FC<ActivityDetailDrawerProps> = ({
  activity,
  isOpen,
  onClose,
}) => {
  if (!activity) return null;

  const statusConfig = getStatusConfig(activity.status);

  // ✅ Hàm mở link bằng Chrome window nhỏ
  const handleOpenUrl = (url: string) => {
    if ((window as any).electronAPI?.openExternalLink) {
      (window as any).electronAPI.openExternalLink(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[500px] bg-white dark:bg-content-dark shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activity Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MaterialSymbol icon="close" className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-73px)] px-6 py-4 custom-scrollbar">
          {/* Type & Time */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <MaterialSymbol
                icon={getTypeIcon(activity.type)}
                className="text-3xl text-primary"
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {activity.type}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.time} • {new Date(activity.datetime).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
              Status
            </label>
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${statusConfig.bg} ${statusConfig.text}`}
            >
              <div className={`w-3 h-3 rounded-full ${statusConfig.badge}`}></div>
              {activity.status}
            </span>
          </div>

          {/* Account */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
              Account
            </label>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <MaterialSymbol icon="person" className="text-xl" />
              <span className="font-medium">@{activity.account}</span>
            </div>
          </div>

          {/* POST/REEL DETAILS */}
          {(activity.type === 'Post' || activity.type === 'Reel') && (
            <>
              {/* Media Gallery */}
              {activity.media && (
                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
                    Media
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.isArray(activity.media) ? (
                      activity.media.map((item, index) => (
                        <div
                          key={index}
                          className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                        >
                          <img
                            src={getMediaUrl(item.url)}
                            alt={`Media ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.onerror = null;
                            }}
                          />
                          {item.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                              <MaterialSymbol icon="play_circle" className="text-4xl text-white" />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={getMediaUrl(activity.media.url)}
                          alt="Media"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                          }}
                        />
                        {activity.type === 'Reel' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                            <MaterialSymbol icon="play_circle" className="text-5xl text-white" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Caption */}
              {activity.content && (
                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
                    Caption
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {activity.content}
                    </p>
                  </div>
                </div>
              )}

              {/* ✅ FIX: Posted URL - Mở bằng Chrome window nhỏ */}
              {(activity.originalData as any).postedUrl && (
                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
                    Instagram Link
                  </label>
                  <button
                    onClick={() => handleOpenUrl((activity.originalData as any).postedUrl)}
                    className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors cursor-pointer bg-transparent border-none p-0"
                  >
                    <MaterialSymbol icon="open_in_new" className="text-lg" />
                    <span className="text-sm font-medium">View on Instagram</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* CARE ACTIVITY DETAILS */}
          {activity.type === 'Care' && activity.careDetails && (
            <>
              {/* Activity Type */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
                  Activity Type
                </label>
                <div className="flex items-center gap-2">
                  <MaterialSymbol
                    icon={activity.careDetails.activityType.includes('Browse') ? 'explore' : 'person_add'}
                    className="text-xl text-green-500"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {activity.careDetails.activityType}
                  </span>
                </div>
              </div>

              {/* Settings */}
              {(activity.originalData as any).settings && (
                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
                    Settings
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-2">
                    {(activity.originalData as any).settings.autoBrowseEnabled && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {(activity.originalData as any).settings.autoBrowseDuration} min
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Scroll Interval:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {(activity.originalData as any).settings.autoBrowseScrollInterval}s
                          </span>
                        </div>
                        {(activity.originalData as any).settings.autoBrowseEnableLike && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Like Count:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {(activity.originalData as any).settings.autoBrowseLikeCount}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {(activity.originalData as any).settings.autoFollowEnabled && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Target:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            @{(activity.originalData as any).settings.autoFollowTargetUsername}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Source:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {(activity.originalData as any).settings.autoFollowSource}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Follow Count:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {(activity.originalData as any).settings.autoFollowCount}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Results */}
              {activity.careDetails.results && (
                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
                    Results
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Actions:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {activity.careDetails.results.totalActions}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Success:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {activity.careDetails.results.successCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        {activity.careDetails.results.failedCount}
                      </span>
                    </div>
                    {activity.careDetails.results.details && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {activity.careDetails.results.details}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Timestamps */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
              Timestamps
            </label>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-2 text-sm">
              {(activity.originalData as any).scheduledAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Scheduled:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date((activity.originalData as any).scheduledAt).toLocaleString()}
                  </span>
                </div>
              )}
              {(activity.originalData as any).postedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Posted:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date((activity.originalData as any).postedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {(activity.originalData as any).executedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Executed:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date((activity.originalData as any).executedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper functions
const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    Post: 'grid_view',
    Reel: 'play_circle',
    Care: 'spa',
  };
  return icons[type] || 'help';
};

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

export default ActivityDetailDrawer;