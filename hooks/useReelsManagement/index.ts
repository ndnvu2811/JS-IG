import React, { useState, useEffect } from 'react';
import { Reel, ReelStatus, InstagramAccount } from '../../types';
import { updateReelHistoryAsPosted } from '../../utils/historyUtils';

// Import sub-hooks
import { useReelsSelection } from './useReelsSelection';
import { useReelsScheduling } from './useReelsScheduling';
import { useReelsVideo } from './useReelsVideo';
import { useReelsPosting } from './useReelsPosting';
import { useReelsImport } from './useReelsImport';
import { useReelsEdit } from './useReelsEdit';

export const useReelsManagement = (selectedAccount: InstagramAccount | null, accounts: InstagramAccount[]) => {
    const [reels, setReels] = useState<Reel[]>(() => {
        try {
            const savedReels = localStorage.getItem('instagram-reels');
            return savedReels ? JSON.parse(savedReels) : [];
        } catch (error) {
            console.error("Could not parse reels from localStorage", error);
            return [];
        }
    });
    const [filter, setFilter] = useState('All');
    const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    // Sub-hooks
    const selection = useReelsSelection(reels, selectedAccount, filter);
    const scheduling = useReelsScheduling(reels, setReels, selection.selectedReelIds);
    const video = useReelsVideo(reels, setReels, selection.filteredReels);
    const posting = useReelsPosting(reels, setReels);
    const imports = useReelsImport(reels, setReels);
    const edit = useReelsEdit(reels, setReels);

    // Persist reels to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('instagram-reels', JSON.stringify(reels));
            window.dispatchEvent(new CustomEvent('storage-change'));
        } catch (error) {
            console.error("Could not save reels to localStorage", error);
        }
    }, [reels]);

    // Listen for external storage changes
    useEffect(() => {
        const handleStorageChange = () => {
            console.log('📦 Storage change detected in reels');
            try {
                const savedReels = localStorage.getItem('instagram-reels');
                if (savedReels) {
                    const parsedReels = JSON.parse(savedReels);
                    console.log('📋 Loaded', parsedReels.length, 'reels from localStorage');
                    setReels(prevReels => {
                        const prevJson = JSON.stringify(prevReels);
                        const newJson = JSON.stringify(parsedReels);
                        if (prevJson !== newJson) {
                            console.log('✅ Reels state updated from storage');
                            return parsedReels;
                        }
                        return prevReels;
                    });
                }
            } catch (error) {
                console.error("Error syncing reels from storage:", error);
            }
        };

        window.addEventListener('storage-change', handleStorageChange);
        return () => window.removeEventListener('storage-change', handleStorageChange);
    }, []);

    // Reload reels when account changes
    useEffect(() => {
        console.log('🔄 Account changed, reloading reels from localStorage');
        try {
            const savedReels = localStorage.getItem('instagram-reels');
            if (savedReels) {
                const parsedReels = JSON.parse(savedReels);
                console.log('📋 Reloaded', parsedReels.length, 'reels');
                setReels(parsedReels);
            }
        } catch (error) {
            console.error('Error reloading reels:', error);
        }
    }, [selectedAccount?.username]);

    // Sync scheduled reels
    useEffect(() => {
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI?.syncScheduledReels) return;

        const scheduledReels = reels
            .filter(r => r.status === ReelStatus.Scheduled && r.scheduledTime)
            .map(r => {
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

        electronAPI.syncScheduledReels(scheduledReels)
            .then(() => console.log('✅ Synced reels:', scheduledReels.length))
            .catch((err: any) => console.error('❌ Sync error:', err));
    }, [reels, accounts]);

    // Electron IPC listeners
    useEffect(() => {
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI) return;
        
        const handleReelMissed = (data: { reelId: number; missedAt: string }) => {
            console.log('⚠️ Reel missed:', data);
            
            const savedReels = localStorage.getItem('instagram-reels');
            if (savedReels) {
                const allReels = JSON.parse(savedReels);
                const updatedReels = allReels.map((r: any) => {
                    if (r.id === data.reelId) {
                        return {
                            ...r,
                            status: 'Missed',
                            updatedAt: data.missedAt,
                        };
                    }
                    return r;
                });
                localStorage.setItem('instagram-reels', JSON.stringify(updatedReels));
                window.dispatchEvent(new CustomEvent('storage-change'));
            }
            
            setReels(prevReels =>
                prevReels.map(r =>
                    r.id === data.reelId
                        ? { 
                            ...r, 
                            status: ReelStatus.Missed,
                            updatedAt: data.missedAt,
                        }
                        : r
                )
            );
        };

        if (electronAPI.onReelMissed) {
            electronAPI.onReelMissed(handleReelMissed);
        }

        const handleReelSuccess = (data: { reelId: number; reelUrl: string }) => {
            console.log('✅ Reel success received in React:', data);
            
            if (!data.reelId) {
                console.error('❌ Missing reelId in handleReelSuccess!');
                return;
            }
            
            const postedTime = new Date().toISOString();
            
            const savedReels = localStorage.getItem('instagram-reels');
            if (savedReels) {
                const allReels = JSON.parse(savedReels);
                const updatedReels = allReels.map((r: any) => {
                    if (r.id === data.reelId) {
                        return {
                            ...r,
                            status: 'Posted',
                            postedUrl: data.reelUrl,
                            updatedAt: postedTime,
                        };
                    }
                    return r;
                });
                localStorage.setItem('instagram-reels', JSON.stringify(updatedReels));
                console.log('📤 Dispatching storage-change event after reel success');
                window.dispatchEvent(new CustomEvent('storage-change'));
                
                updateReelHistoryAsPosted(data.reelId, data.reelUrl, postedTime);
            }
            
            setReels(prevReels => {
                console.log('🔄 Updating reels state, looking for reelId:', data.reelId);
                return prevReels.map(r => {
                    if (r.id === data.reelId) {
                        console.log('✅ Found reel to update:', r.id, '-> status: Posted');
                        return { 
                            ...r, 
                            status: ReelStatus.Posted, 
                            postedUrl: data.reelUrl,
                            updatedAt: postedTime,
                        };
                    }
                    return r;
                });
            });
        };

        const handleSchedulerStart = (data: { reelId: number }) => {
            console.log('🕐 Scheduler starting reel:', data.reelId);
        
            const savedReels = localStorage.getItem('instagram-reels');
            if (savedReels) {
                const allReels = JSON.parse(savedReels);
                const updatedReels = allReels.map((r: any) => {
                    if (r.id === data.reelId) {
                        return {
                            ...r,
                            status: 'Posting',
                            updatedAt: new Date().toISOString(),
                        };
                    }
                    return r;
                });
                localStorage.setItem('instagram-reels', JSON.stringify(updatedReels));
                window.dispatchEvent(new CustomEvent('storage-change'));
            }
        
            setReels(prevReels => {
                const updatedReels = prevReels.map(r =>
                    r.id === data.reelId
                        ? { ...r, status: ReelStatus.Posting, updatedAt: new Date().toISOString() }
                        : r
                );
                
                return updatedReels;
            });
        };

        const handleReelError = (data: { reelId: number; error: string }) => {
            alert(`Failed to post reel: ${data.error}`);
            
            const savedReels = localStorage.getItem('instagram-reels');
            if (savedReels) {
                const allReels = JSON.parse(savedReels);
                const updatedReels = allReels.map((r: any) => {
                    if (r.id === data.reelId) {
                        return { ...r, status: 'Draft' };
                    }
                    return r;
                });
                localStorage.setItem('instagram-reels', JSON.stringify(updatedReels));
                window.dispatchEvent(new CustomEvent('storage-change'));
            }
            
            setReels(prevReels =>
                prevReels.map(r => (r.id === data.reelId ? { ...r, status: ReelStatus.Draft } : r))
            );
        };

        const handleSchedulerSuccess = (data: { reelId: number; publishedAt: string; reelUrl?: string }) => {
            console.log('✅ Scheduler posted reel:', data);
            
            const savedReels = localStorage.getItem('instagram-reels');
            if (savedReels) {
                const allReels = JSON.parse(savedReels);
                const updatedReels = allReels.map((r: any) => {
                    if (r.id === data.reelId) {
                        return {
                            ...r,
                            status: 'Posted',
                            postedUrl: data.reelUrl || r.postedUrl,
                            updatedAt: data.publishedAt,
                        };
                    }
                    return r;
                });
                localStorage.setItem('instagram-reels', JSON.stringify(updatedReels));
                window.dispatchEvent(new CustomEvent('storage-change'));
                
                updateReelHistoryAsPosted(data.reelId, data.reelUrl || '', data.publishedAt);
            }
            
            setReels(prevReels =>
                prevReels.map(r => {
                    if (r.id === data.reelId) {
                        return { 
                            ...r, 
                            status: ReelStatus.Posted,
                            postedUrl: data.reelUrl || r.postedUrl,
                            updatedAt: data.publishedAt,
                        };
                    }
                    return r;
                })
            );
        };

        const handleSchedulerError = (data: { reelId: number; error: string }) => {
            console.error('❌ Scheduler error:', data);
            alert(`Scheduled reel failed: ${data.error}`);
            
            const savedReels = localStorage.getItem('instagram-reels');
            if (savedReels) {
                const allReels = JSON.parse(savedReels);
                const updatedReels = allReels.map((r: any) => {
                    if (r.id === data.reelId) {
                        return {
                            ...r,
                            status: 'Draft',
                            scheduledTime: undefined,
                        };
                    }
                    return r;
                });
                localStorage.setItem('instagram-reels', JSON.stringify(updatedReels));
                window.dispatchEvent(new CustomEvent('storage-change'));
            }
            
            setReels(prevReels =>
                prevReels.map(r =>
                    r.id === data.reelId
                        ? { 
                            ...r, 
                            status: ReelStatus.Draft,
                            scheduledTime: undefined,
                        }
                        : r
                )
            );
        };

        const cleanups: (() => void)[] = [];
        
        if (electronAPI.onPostReelSuccess) {
            console.log('✅ Setting up onPostReelSuccess listener');
            const cleanup = electronAPI.onPostReelSuccess(handleReelSuccess);
            if (cleanup) cleanups.push(cleanup);
        }
        if (electronAPI.onPostReelError) {
            console.log('✅ Setting up onPostReelError listener');
            const cleanup = electronAPI.onPostReelError(handleReelError);
            if (cleanup) cleanups.push(cleanup);
        }
        if (electronAPI.onReelStatusUpdate) {
            const cleanup = electronAPI.onReelStatusUpdate(handleSchedulerStart);
            if (cleanup) cleanups.push(cleanup);
        }
        if (electronAPI.onReelPublishingSuccess) {
            const cleanup = electronAPI.onReelPublishingSuccess(handleSchedulerSuccess);
            if (cleanup) cleanups.push(cleanup);
        }
        if (electronAPI.onReelPublishingError) {
            const cleanup = electronAPI.onReelPublishingError(handleSchedulerError);
            if (cleanup) cleanups.push(cleanup);
        }

        return () => cleanups.forEach(fn => fn());
    }, []);

    // Create empty rows for account
    useEffect(() => {
        if (!selectedAccount) return;
        setReels(currentReels => {
            const accountReels = currentReels.filter(r => r.account === selectedAccount.username);
            if (accountReels.length >= 10) return currentReels;

            let lastId = currentReels.reduce((maxId, reel) => Math.max(reel.id, maxId), 0);
            const newReels: Reel[] = Array.from({ length: 10 - accountReels.length }, () => ({
                id: ++lastId,
                content: '',
                video: { url: '' },
                status: ReelStatus.Draft,
                account: selectedAccount.username,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                shareToThreads: false,
            }));

            return [...currentReels, ...newReels];
        });
    }, [selectedAccount]);

    const handleAddRow = () => {
        if (!selectedAccount) return;
        const lastId = reels.reduce((maxId, reel) => Math.max(reel.id, maxId), 0);
        setReels(prev => [
            ...prev,
            {
                id: lastId + 1,
                content: '',
                video: { url: '' },
                status: ReelStatus.Draft,
                account: selectedAccount.username,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                shareToThreads: false,
            },
        ]);
    };

    // Combine posting with proper account
    const handlePostNowWrapped = (reelId: number) => {
        posting.handlePostNow(reelId, selectedAccount);
    };

    const handleImportFromScraperWrapped = (items: any[]) => {
        imports.handleImportFromScraper(items, selectedAccount);
    };

    const handleBulkDeleteWrapped = () => {
        video.handleBulkDelete(selection.selectedReelIds);
        selection.setSelectedReelIds(new Set());
    };

    return {
        // State
        reels,
        setReels,
        filter,
        setFilter,
        selectedReelIds: selection.selectedReelIds,
        isScheduleModalOpen,
        setIsScheduleModalOpen,
        isBulkAddModalOpen,
        setIsBulkAddModalOpen,
        isAutoEditModalOpen: edit.isAutoEditModalOpen,
        setIsAutoEditModalOpen: edit.setIsAutoEditModalOpen,
        autoEditConfig: edit.autoEditConfig,
        
        // Derived
        filteredReels: selection.filteredReels,
        isAllSelected: selection.isAllSelected,
        
        // Selection handlers
        handleSelectReel: selection.handleSelectReel,
        handleSelectAll: selection.handleSelectAll,
        
        // Content/Video handlers
        handleContentChange: video.handleContentChange,
        handleVideoChange: video.handleVideoChange,
        handleDeleteReel: video.handleDeleteReel,
        handleRowNumberChange: video.handleRowNumberChange,
        handleSaveVideoToLibrary: video.handleSaveVideoToLibrary,
        handleDeleteVideoFromLibrary: video.handleDeleteVideoFromLibrary,
        
        // Posting handlers
        handlePostNow: handlePostNowWrapped,
        handleShareToThreadsChange: posting.handleShareToThreadsChange,
        
        // Schedule handlers
        handleScheduleChange: scheduling.handleScheduleChange,
        handleConfirmAdvancedBulkSchedule: scheduling.handleConfirmAdvancedBulkSchedule,
        handleBulkClearSchedule: scheduling.handleBulkClearSchedule,
        handleBulkDelete: handleBulkDeleteWrapped,
        
        // Row handlers
        handleAddRow,
        
        // Import handlers
        handleImportFromScraper: handleImportFromScraperWrapped,
        
        // Edit handlers
        handleEditVideos: edit.handleEditVideos,
        handleConfirmAutoEdit: edit.handleConfirmAutoEdit,
    };
};
