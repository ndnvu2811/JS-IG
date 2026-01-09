import { useState, useEffect, useMemo } from 'react';
import { 
  getPostsHistory, 
  getReelsHistory, 
  getCareHistory,
  syncMissedStatusToHistory
} from '../utils/historyUtils';
import { InstagramAccount, PostHistory, ReelHistory, CareHistory } from '../types';

export interface DashboardActivity {
  id: string;
  type: 'Post' | 'Reel' | 'Care';
  account: string;
  time: string;
  datetime: string;
  status: 'Posted' | 'Scheduled' | 'Posting' | 'Failed' | 'Missed' | 'Draft' | 'Completed';
  content?: string;
  media?: { type: 'image' | 'video'; url: string }[] | { url: string };
  thumbnail?: string;
  careDetails?: {
    activityType: string;
    duration?: number;
    results?: any;
  };
  originalData: PostHistory | ReelHistory | CareHistory;
}

export interface DashboardStats {
  totalPosts: number;
  totalReels: number;
  totalCare: number;
  statusBreakdown: {
    Posted: number;
    Scheduled: number;
    Posting: number;
    Failed: number;
    Missed: number;
    Draft: number;
    Completed: number;
  };
}

export const useDashboard = (accounts: InstagramAccount[]) => {
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'posts' | 'reels' | 'care'>('all');
  const [selectedActivity, setSelectedActivity] = useState<DashboardActivity | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    syncMissedStatusToHistory();
    
    const handleStorageChange = () => {
      syncMissedStatusToHistory();
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('storage-change', handleStorageChange);
    return () => window.removeEventListener('storage-change', handleStorageChange);
  }, []);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const tomorrow = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return date;
  }, [today]);

  const isDateMatch = (dateString: string | undefined, targetDate: Date): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return (
      date.getFullYear() === targetDate.getFullYear() &&
      date.getMonth() === targetDate.getMonth() &&
      date.getDate() === targetDate.getDate()
    );
  };

  const extractTime = (dateString: string | undefined): string => {
    if (!dateString) return '00:00';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getThumbnail = (media: any): string | undefined => {
    if (!media) return undefined;
    if (Array.isArray(media) && media.length > 0) {
      return media[0].url;
    }
    if (media.url) {
      return media.url;
    }
    return undefined;
  };

  const convertPostsToActivities = (posts: PostHistory[]): DashboardActivity[] => {
    return posts.map(post => ({
      id: post.id,
      type: 'Post' as const,
      account: post.account,
      time: extractTime(post.scheduledAt || post.postedAt),
      datetime: post.scheduledAt || post.postedAt || '',
      status: post.status,
      content: post.content,
      media: post.media,
      thumbnail: getThumbnail(post.media),
      originalData: post,
    }));
  };

  const convertReelsToActivities = (reels: ReelHistory[]): DashboardActivity[] => {
    return reels.map(reel => ({
      id: reel.id,
      type: 'Reel' as const,
      account: reel.account,
      time: extractTime(reel.scheduledAt || reel.postedAt),
      datetime: reel.scheduledAt || reel.postedAt || '',
      status: reel.status,
      content: reel.content,
      media: reel.video,
      thumbnail: reel.video?.url,
      originalData: reel,
    }));
  };

  const convertCareToActivities = (care: CareHistory[]): DashboardActivity[] => {
    return care.map(c => {
      let activityType = 'Care Activity';
      if (c.settings?.autoBrowseEnabled) activityType = 'Auto Browse';
      if (c.settings?.autoFollowEnabled) activityType = 'Auto Follow';

      return {
        id: c.id,
        type: 'Care' as const,
        account: c.accounts.join(', '),
        time: extractTime(c.scheduledAt || c.executedAt),
        datetime: c.scheduledAt || c.executedAt || '',
        status: c.status === 'Completed' ? 'Completed' : c.status === 'Missed' ? 'Missed' : 'Scheduled',
        careDetails: {
          activityType,
          duration: c.settings?.autoBrowseDuration,
          results: c.result,
        },
        originalData: c,
      };
    });
  };

  const getActivitiesForDate = (targetDate: Date): DashboardActivity[] => {
    const posts = getPostsHistory().filter(p => 
      isDateMatch(p.scheduledAt, targetDate) || isDateMatch(p.postedAt, targetDate)
    );
    const reels = getReelsHistory().filter(r => 
      isDateMatch(r.scheduledAt, targetDate) || isDateMatch(r.postedAt, targetDate)
    );
    const care = getCareHistory().filter(c => 
      isDateMatch(c.scheduledAt, targetDate) || isDateMatch(c.executedAt, targetDate)
    );

    const activities = [
      ...convertPostsToActivities(posts),
      ...convertReelsToActivities(reels),
      ...convertCareToActivities(care),
    ];

    return activities.sort((a, b) => {
      const timeA = new Date(a.datetime).getTime();
      const timeB = new Date(b.datetime).getTime();
      return timeA - timeB;
    });
  };

  const filterActivities = (activities: DashboardActivity[]): DashboardActivity[] => {
    let filtered = activities;

    if (selectedAccount !== 'all') {
      filtered = filtered.filter(a => a.account.includes(selectedAccount));
    }

    if (selectedType !== 'all') {
      if (selectedType === 'posts') filtered = filtered.filter(a => a.type === 'Post');
      if (selectedType === 'reels') filtered = filtered.filter(a => a.type === 'Reel');
      if (selectedType === 'care') filtered = filtered.filter(a => a.type === 'Care');
    }

    return filtered;
  };

  const calculateStats = (activities: DashboardActivity[]): DashboardStats => {
    const stats: DashboardStats = {
      totalPosts: 0,
      totalReels: 0,
      totalCare: 0,
      statusBreakdown: {
        Posted: 0,
        Scheduled: 0,
        Posting: 0,
        Failed: 0,
        Missed: 0,
        Draft: 0,
        Completed: 0,
      },
    };

    activities.forEach(activity => {
      if (activity.type === 'Post') stats.totalPosts++;
      if (activity.type === 'Reel') stats.totalReels++;
      if (activity.type === 'Care') stats.totalCare++;

      stats.statusBreakdown[activity.status]++;
    });

    return stats;
  };

  const todayActivitiesRaw = useMemo(() => getActivitiesForDate(today), [today, refreshKey]);
  const tomorrowActivitiesRaw = useMemo(() => getActivitiesForDate(tomorrow), [tomorrow, refreshKey]);

  const todayActivities = useMemo(() => filterActivities(todayActivitiesRaw), [todayActivitiesRaw, selectedAccount, selectedType]);
  const tomorrowActivities = useMemo(() => filterActivities(tomorrowActivitiesRaw), [tomorrowActivitiesRaw, selectedAccount, selectedType]);

  const todayStats = useMemo(() => calculateStats(todayActivities), [todayActivities]);
  const tomorrowStats = useMemo(() => calculateStats(tomorrowActivities), [tomorrowActivities]);

  const handleActivityClick = (activity: DashboardActivity) => {
    setSelectedActivity(activity);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedActivity(null);
  };

  return {
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
  };
};