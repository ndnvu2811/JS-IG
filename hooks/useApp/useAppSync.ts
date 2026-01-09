import { useEffect } from 'react';
import { InstagramAccount } from '../../types';

export const useAppSync = (accounts: InstagramAccount[]) => {
    // ===================================================
    // Background Sync - Posts & Reels & Care (every 10s)
    // ===================================================
    useEffect(() => {
        const syncToElectron = async () => {
            try {
                // Sync Posts
                const postsRaw = localStorage.getItem('instagram-posts');
                if (postsRaw && window.electronAPI?.syncPosts) {
                    const posts = JSON.parse(postsRaw);
                    const scheduledPosts = posts
                        .filter((p: any) => p.status === 'Scheduled' && p.scheduledTime)
                        .map((p: any) => {
                            const account = accounts.find(a => a.username === p.account);
                            return {
                                id: p.id,
                                caption: p.content,
                                media: p.media || [],
                                scheduledTime: p.scheduledTime,
                                username: p.account,
                                cookiesPath: account?.cookiesPath,
                                shareToThreads: p.shareToThreads || false,
                            };
                        });
                    
                    await window.electronAPI.syncPosts(scheduledPosts);
                }

                // Sync Reels
                const reelsRaw = localStorage.getItem('instagram-reels');
                if (reelsRaw && window.electronAPI?.syncReels) {
                    const reels = JSON.parse(reelsRaw);
                    const scheduledReels = reels
                        .filter((r: any) => r.status === 'Scheduled' && r.scheduledTime)
                        .map((r: any) => {
                            const account = accounts.find(a => a.username === r.account);
                            return {
                                id: r.id,
                                caption: r.content,
                                video: r.video,
                                scheduledTime: r.scheduledTime,
                                username: r.account,
                                cookiesPath: account?.cookiesPath,
                                shareToThreads: r.shareToThreads || false,
                                aspectRatio: r.aspectRatio || '9:16',
                            };
                        });
                    
                    await window.electronAPI.syncScheduledReels(scheduledReels);
                }

                // Sync Care Activities
                const schedulesRaw = localStorage.getItem('care-activity-schedules');
                if (schedulesRaw) {
                    const schedules = JSON.parse(schedulesRaw);
                    const now = new Date();
                    const currentDate = now.toISOString().split('T')[0];
                    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                    const toRun = schedules.filter((schedule: any) => {
                        if (schedule.status === 'Completed' || schedule.status === 'Missed') return false;
                        if (schedule.schedule.date !== currentDate) return false;
                        if (!schedule.schedule.times.includes(currentTime)) return false;
                        
                        const key = `last-run-${schedule.id}-${currentDate}-${currentTime}`;
                        const lastRun = localStorage.getItem(key);
                        if (lastRun) {
                            const diff = Date.now() - parseInt(lastRun);
                            if (diff < 60000) return false;
                        }
                        
                        return true;
                    });

                    if (toRun.length > 0 && window.electronAPI?.runCareSchedule) {
                        console.log(`🎯 ${toRun.length} care schedule(s) to run!`);
                        
                        for (const schedule of toRun) {
                            const accountIds = [
                                ...(schedule.settings.autoBrowseAccounts || []),
                                ...(schedule.settings.autoFollowAccounts || [])
                            ];
                            
                            const selectedAccounts = accounts.filter(a => accountIds.includes(a.id));
                            
                            if (selectedAccounts.length > 0) {
                                console.log(`▶️ Running schedule: ${schedule.id}`);
                                window.electronAPI.runCareSchedule(schedule, selectedAccounts, currentDate, currentTime);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Background sync error:', error);
            }
        };

        syncToElectron();
        const interval = setInterval(syncToElectron, 10000);
        return () => clearInterval(interval);
    }, [accounts]);

    // ===================================================
    // Care Activity Scheduler Listener
    // ===================================================
    useEffect(() => {
        if (!window.electronAPI?.onCareScheduleCheck) {
            return;
        }

        console.log('🔗 Setting up Care Schedule listener...');

        const cleanup = window.electronAPI.onCareScheduleCheck((data: { currentDate: string, currentTime: string }) => {
            const { currentDate, currentTime } = data;
            console.log(`📨 Received schedule check: ${currentDate} ${currentTime}`);
            
            try {
                const schedulesRaw = localStorage.getItem('care-activity-schedules');
                const accountsRaw = localStorage.getItem('instagram-accounts');
                
                if (!schedulesRaw || !accountsRaw) {
                    console.log('🔭 No schedules or accounts found');
                    return;
                }

                const schedules = JSON.parse(schedulesRaw);
                const allAccounts = JSON.parse(accountsRaw);

                const toRun = schedules.filter((schedule: any) => {
                    if (schedule.schedule.date !== currentDate) return false;
                    if (!schedule.schedule.times.includes(currentTime)) return false;
                    
                    const key = `last-run-${schedule.id}-${currentDate}-${currentTime}`;
                    const lastRun = localStorage.getItem(key);
                    if (lastRun) {
                        const diff = Date.now() - parseInt(lastRun);
                        if (diff < 60000) return false;
                    }
                    
                    return true;
                });

                if (toRun.length > 0) {
                    console.log(`🎯 ${toRun.length} schedule(s) to run!`);
                    
                    toRun.forEach((schedule: any) => {
                        console.log(`▶️ Sending schedule ${schedule.id} to main process`);
                        window.electronAPI.runCareSchedule?.(schedule, allAccounts, currentDate, currentTime);
                        
                        const key = `last-run-${schedule.id}-${currentDate}-${currentTime}`;
                        localStorage.setItem(key, String(Date.now()));
                    });
                } else {
                    console.log('✅ No schedules to run at this time');
                }
            } catch (error) {
                console.error('❌ Error processing schedules:', error);
            }
        });

        return cleanup;
    }, []);

    // ===================================================
    // Reel Scheduler - Sync reels to Electron
    // ===================================================
    useEffect(() => {
        const syncReelsToElectron = () => {
            try {
                const reelsRaw = localStorage.getItem('instagram-reels');
                if (!reelsRaw) return;

                const reels = JSON.parse(reelsRaw);
                const scheduledReels = reels
                    .filter((r: any) => r.status === 'Scheduled' && r.scheduledTime)
                    .map((r: any) => {
                        const account = accounts.find(acc => acc.username === r.account);
                        
                        return {
                            id: r.id,
                            caption: r.content,
                            video: r.video,
                            scheduledTime: r.scheduledTime,
                            status: 'Scheduled',
                            username: r.account,
                            cookies: account?.cookiesPath ? [] : [],
                            cookiesPath: account?.cookiesPath,
                            shareToThreads: r.shareToThreads || false,
                            aspectRatio: r.aspectRatio || '9:16',
                        };
                    });

                if (window.electronAPI?.syncScheduledReels) {
                    window.electronAPI.syncScheduledReels(scheduledReels);
                    console.log(`📤 Synced ${scheduledReels.length} scheduled reels to Electron`);
                }
            } catch (error) {
                console.error('Error syncing reels:', error);
            }
        };

        syncReelsToElectron();
        window.addEventListener('storage-change', syncReelsToElectron);
        return () => window.removeEventListener('storage-change', syncReelsToElectron);
    }, [accounts]);

    // ===================================================
    // Listen for Care Schedule Completion
    // ===================================================
    useEffect(() => {
        if (!window.electronAPI?.onCareScheduleCompleted) return;

        const handleCompleted = (data: { scheduleId: string; success: boolean }) => {
            console.log('✅ Care schedule completed:', data);
            
            try {
                const schedulesRaw = localStorage.getItem('care-activity-schedules');
                if (!schedulesRaw) return;
                
                const schedules = JSON.parse(schedulesRaw);
                const updated = schedules.map((s: any) => {
                    if (s.id === data.scheduleId) {
                        return {
                            ...s,
                            status: data.success ? 'Completed' : 'Scheduled',
                            completedAt: data.success ? new Date().toISOString() : undefined
                        };
                    }
                    return s;
                });
                
                localStorage.setItem('care-activity-schedules', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('storage-change'));
            } catch (error) {
                console.error('Error updating schedule status:', error);
            }
        };

        window.electronAPI.onCareScheduleCompleted(handleCompleted);
    }, []);
};
