import React, { useState, useMemo, useEffect } from 'react';
import { Post, PostStatus, InstagramAccount, PostType } from '../../types';
import { savePostToHistory, updatePostHistoryAsPosted } from '../../utils/historyUtils';
import { syncMediaToLibrary, removeMediaFromLibrary, setEditorImagesFromContent } from '../../utils/library';
import { useContentSelection } from './useContentSelection';
import { useContentScheduling } from './useContentScheduling';
import { useContentMedia } from './useContentMedia';
import { useContentPosting } from './useContentPosting';
import { useContentImport } from './useContentImport';
import { useContentBulk } from './useContentBulk';

export const useContentManagement = (selectedAccount: InstagramAccount | null, accounts: InstagramAccount[]) => {
    const [posts, setPosts] = useState<Post[]>(() => {
        try {
            const savedPosts = localStorage.getItem('instagram-posts');
            return savedPosts ? JSON.parse(savedPosts) : [];
        } catch (error) {
            console.error("Could not parse posts from localStorage", error);
            return [];
        }
    });
    
    const [filter, setFilter] = useState('All');
    const [selectedPostIds, setSelectedPostIds] = useState(new Set<number>());
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);

    // ✅ Đảm bảo luôn có ít nhất 10 dòng cho mỗi account
    const initRef = React.useRef<Set<string>>(new Set());
    
    useEffect(() => {
        if (!selectedAccount) return;
        
        const accountKey = selectedAccount.username;
        if (initRef.current.has(accountKey)) return;
        
        const accountPosts = posts.filter(p => p.account === selectedAccount.username);
        const currentCount = accountPosts.length;
        
        console.log(`🔍 Init check for ${accountKey}: currentCount=${currentCount}`);
        
        if (currentCount === 0) {
            const rowsToAdd = 10;
            const maxId = posts.reduce((max, post) => Math.max(max, post.id), 0);
            const baseId = Math.max(maxId, Date.now());
            
            const newPosts: Post[] = [];
            for (let i = 1; i <= rowsToAdd; i++) {
                newPosts.push({
                    id: baseId + i,
                    content: '',
                    media: [],
                    status: PostStatus.Draft,
                    account: selectedAccount.username,
                    type: 'Post',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            }
            
            setPosts(prev => [...prev, ...newPosts]);
            initRef.current.add(accountKey);
            console.log(`✅ Added ${rowsToAdd} empty rows for ${accountKey}`);
        } else {
            initRef.current.add(accountKey);
        }
    }, [selectedAccount, posts]);

    // ✅ Save posts to localStorage
    useEffect(() => {
        localStorage.setItem('instagram-posts', JSON.stringify(posts));
    }, [posts]);

    // ✅ Listen for storage changes from other components
    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const savedPosts = localStorage.getItem('instagram-posts');
                if (savedPosts) {
                    const parsedPosts = JSON.parse(savedPosts);
                    setPosts(prevPosts => {
                        const prevJson = JSON.stringify(prevPosts);
                        const newJson = JSON.stringify(parsedPosts);
                        if (prevJson !== newJson) {
                            return parsedPosts;
                        }
                        return prevPosts;
                    });
                }
            } catch (error) {
                console.error("Error syncing posts from storage:", error);
            }
        };

        window.addEventListener('storage-change', handleStorageChange);
        return () => window.removeEventListener('storage-change', handleStorageChange);
    }, []);

    // ✅ CRITICAL: Sync posts to Electron scheduler
    useEffect(() => {
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI?.syncPosts) return;

        // ✅ FIX: Include both Scheduled AND Failed posts (Failed can be retried)
        const scheduledPosts = posts
            .filter(p => 
                (p.status === PostStatus.Scheduled || p.status === PostStatus.Failed) && 
                p.scheduledTime
            )
            .map(p => {
                const account = accounts.find(acc => acc.username === p.account);
                
                // ✅ DEBUG: Log each post being synced
                console.log(`📋 Syncing post ${p.id}:`, {
                    username: p.account,
                    cookiesPath: account?.cookiesPath ? '✅' : '❌',
                    status: p.status,
                    scheduledTime: p.scheduledTime
                });
                
                return {
                    id: p.id,
                    caption: p.content,
                    media: p.media,
                    scheduledTime: p.scheduledTime,
                    status: p.status === PostStatus.Failed ? 'Failed' : 'Scheduled', // Keep Failed status for retry
                    username: p.account,
                    cookies: [],
                    cookiesPath: account?.cookiesPath,
                    shareToThreads: p.shareToThreads || false,
                };
            });

        console.log(`\n📤 ====== SYNCING ${scheduledPosts.length} POSTS TO ELECTRON ======`);
        scheduledPosts.forEach((p, i) => {
            console.log(`   [${i}] ID: ${p.id}, Username: ${p.username}, CookiesPath: ${p.cookiesPath ? '✅' : '❌'}`);
        });

        electronAPI.syncPosts(scheduledPosts)
            .then(() => {
                console.log('✅ Synced posts to Electron:', scheduledPosts.length);
            })           
            .catch((err: any) => console.error('❌ Sync error:', err));
    }, [posts, accounts]);

    // ✅ Setup Electron IPC listeners
    useEffect(() => {
        const electronAPI = (window as any).electronAPI;
        
        if (!electronAPI) return;

        const handlePostSuccess = (data: { postId: number; postUrl: string }) => {
            console.log('✅ Post success:', data);
            const postedTime = new Date().toISOString();
            
            const savedPosts = localStorage.getItem('instagram-posts');
            if (savedPosts) {
                const allPosts = JSON.parse(savedPosts);
                const updatedPosts = allPosts.map((p: any) => {
                    if (p.id === data.postId) {
                        return {
                            ...p,
                            status: 'Posted',
                            postedUrl: data.postUrl,
                            updatedAt: postedTime,
                        };
                    }
                    return p;
                });
                localStorage.setItem('instagram-posts', JSON.stringify(updatedPosts));
                window.dispatchEvent(new CustomEvent('storage-change'));
                
                updatePostHistoryAsPosted(data.postId, data.postUrl, postedTime);
            }
            
            setPosts(prevPosts =>
                prevPosts.map(p => {
                    if (p.id === data.postId) {
                        return { 
                            ...p, 
                            status: PostStatus.Posted,
                            postedUrl: data.postUrl,
                            updatedAt: postedTime,
                        };
                    }
                    return p;
                })
            );
        };

        const handlePostError = (data: { postId: number; error: string }) => {
            console.error('❌ Post error:', data);
            alert(`Failed to post: ${data.error}`);
            
            const savedPosts = localStorage.getItem('instagram-posts');
            if (savedPosts) {
                const allPosts = JSON.parse(savedPosts);
                const updatedPosts = allPosts.map((p: any) => {
                    if (p.id === data.postId) {
                        return { ...p, status: 'Failed' };
                    }
                    return p;
                });
                localStorage.setItem('instagram-posts', JSON.stringify(updatedPosts));
                window.dispatchEvent(new CustomEvent('storage-change'));
            }
            
            setPosts(prevPosts =>
                prevPosts.map(p =>
                    p.id === data.postId
                        ? { ...p, status: PostStatus.Failed }
                        : p
                )
            );
        };

        const handleSchedulerStart = (data: { postId: number }) => {
            console.log('🕐 Scheduler starting post:', data.postId);
            
            const savedPosts = localStorage.getItem('instagram-posts');
            if (savedPosts) {
                const allPosts = JSON.parse(savedPosts);
                const updatedPosts = allPosts.map((p: any) => {
                    if (p.id === data.postId) {
                        return { ...p, status: 'Posting', updatedAt: new Date().toISOString() };
                    }
                    return p;
                });
                localStorage.setItem('instagram-posts', JSON.stringify(updatedPosts));
                window.dispatchEvent(new CustomEvent('storage-change'));
            }
            
            setPosts(prevPosts =>
                prevPosts.map(p =>
                    p.id === data.postId
                        ? { ...p, status: PostStatus.Posting, updatedAt: new Date().toISOString() }
                        : p
                )
            );
        };

        const handleSchedulerSuccess = (data: { postId: number; publishedAt: string; postUrl: string }) => {
            console.log('✅ Scheduler success:', data);
            
            const savedPosts = localStorage.getItem('instagram-posts');
            if (savedPosts) {
                const allPosts = JSON.parse(savedPosts);
                const updatedPosts = allPosts.map((p: any) => {
                    if (p.id === data.postId) {
                        return { 
                            ...p, 
                            status: 'Posted',
                            postedUrl: data.postUrl,
                            updatedAt: data.publishedAt,
                        };
                    }
                    return p;
                });
                localStorage.setItem('instagram-posts', JSON.stringify(updatedPosts));
                window.dispatchEvent(new CustomEvent('storage-change'));
                
                updatePostHistoryAsPosted(data.postId, data.postUrl, data.publishedAt);
            }
            
            setPosts(prevPosts =>
                prevPosts.map(p =>
                    p.id === data.postId
                        ? { 
                            ...p, 
                            status: PostStatus.Posted,
                            postedUrl: data.postUrl,
                            updatedAt: data.publishedAt,
                        }
                        : p
                )
            );
        };

        const handleSchedulerError = (data: { postId: number; error: string }) => {
            console.error('❌ Scheduler error:', data);
            
            const savedPosts = localStorage.getItem('instagram-posts');
            if (savedPosts) {
                const allPosts = JSON.parse(savedPosts);
                const updatedPosts = allPosts.map((p: any) => {
                    if (p.id === data.postId) {
                        return { ...p, status: 'Failed' };
                    }
                    return p;
                });
                localStorage.setItem('instagram-posts', JSON.stringify(updatedPosts));
                window.dispatchEvent(new CustomEvent('storage-change'));
            }
            
            setPosts(prevPosts =>
                prevPosts.map(p =>
                    p.id === data.postId
                        ? { ...p, status: PostStatus.Failed }
                        : p
                )
            );
        };

        // Listen to events
        if (electronAPI.onPostSuccess) {
            electronAPI.onPostSuccess(handlePostSuccess);
        }
        if (electronAPI.onPostError) {
            electronAPI.onPostError(handlePostError);
        }
        if (electronAPI.onPostStatusUpdate) {
            electronAPI.onPostStatusUpdate(handleSchedulerStart);
        }
        if (electronAPI.onPostPublishingSuccess) {
            electronAPI.onPostPublishingSuccess(handleSchedulerSuccess);
        }
        if (electronAPI.onPostPublishingError) {
            electronAPI.onPostPublishingError(handleSchedulerError);
        }
    }, []);

    // ✅ Computed values
    const filteredPosts = useMemo(() => {
        let filtered = posts;
        
        if (selectedAccount) {
            filtered = filtered.filter(p => p.account === selectedAccount.username);
        }
        
        if (filter !== 'All') {
            filtered = filtered.filter(p => p.status === filter);
        }
        
        filtered = filtered.sort((a, b) => {
            const aHasContent = a.content && a.content.trim().length > 0 ? 1 : 0;
            const bHasContent = b.content && b.content.trim().length > 0 ? 1 : 0;
            return bHasContent - aHasContent;
        });
        
        return filtered;
    }, [posts, selectedAccount, filter]);

    // ✅ Setup sub-hooks - PASS accounts to useContentScheduling
    const selectionHandlers = useContentSelection(posts, selectedAccount, filter);
    const schedulingHandlers = useContentScheduling(posts, setPosts, selectedPostIds, setSelectedPostIds, accounts);
    const mediaHandlers = useContentMedia(posts, setPosts, filteredPosts);
    const postingHandlers = useContentPosting(posts, setPosts, accounts);
    const importHandlers = useContentImport(posts, setPosts);
    const bulkHandlers = useContentBulk(posts, setPosts, selectedPostIds);

    const isAllSelected = filteredPosts.length > 0 && selectedPostIds.size === filteredPosts.length;

    // ✅ Wrapped handlers
    const handleSelectPost = (postId: number) => {
        selectionHandlers.handleSelectPost(postId, selectedPostIds, setSelectedPostIds);
    };

    const handleSelectAll = () => {
        selectionHandlers.handleSelectAll(selectedPostIds, setSelectedPostIds);
    };

    const handleBulkAddPosts = (parsedData: Array<{ content: string; media: { type: 'image' | 'video'; url: string }[] }>) => {
        bulkHandlers.handleBulkAddPosts(parsedData, selectedAccount);
        setIsBulkAddModalOpen(false);
    };

    const handleAddRow = () => {
        bulkHandlers.handleAddRow(selectedAccount);
    };

    const handleImportFromScraper = (items: any[]) => {
        importHandlers.handleImportFromScraper(items, selectedAccount);
    };

    const handleSaveMediaToLibrary = async (postId: number) => {
        const post = posts.find(p => p.id === postId);
        if (!post || post.media.length === 0) {
            alert('No media to save');
            return;
        }

        try {
            await syncMediaToLibrary(postId, post.media, post.type);
            
            const batchName = `${post.type}_${postId}`;
            setPosts(prevPosts =>
                prevPosts.map(p =>
                    p.id === postId
                        ? { ...p, batchName, updatedAt: new Date().toISOString() }
                        : p
                )
            );

            alert(`✅ Media saved to Library (Folder: ${batchName})`);
        } catch (error) {
            console.error('Error saving media:', error);
            alert('Failed to save media to library');
        }
    };

    const handleDeleteMediaFromLibrary = async (postId: number, postType: PostType) => {
        try {
            await removeMediaFromLibrary(postId, postType);
        } catch (error) {
            console.error('Error removing media:', error);
        }
    };

    return {
        posts,
        setPosts,
        filter,
        setFilter,
        selectedPostIds,
        isScheduleModalOpen,
        setIsScheduleModalOpen,
        isBulkAddModalOpen,
        setIsBulkAddModalOpen,
        filteredPosts,
        isAllSelected,
        
        handleSelectPost,
        handleSelectAll,
        
        handleScheduleChange: schedulingHandlers.handleScheduleChange,
        handleConfirmAdvancedBulkSchedule: schedulingHandlers.handleConfirmAdvancedBulkSchedule,
        handleBulkClearSchedule: schedulingHandlers.handleBulkClearSchedule,
        
        handleContentChange: mediaHandlers.handleContentChange,
        handleTypeChange: mediaHandlers.handleTypeChange,
        handleMediaChange: mediaHandlers.handleMediaChange,
        handleMediaRemove: mediaHandlers.handleMediaRemove,
        handleRowNumberChange: mediaHandlers.handleRowNumberChange,
        handleQuickFix: mediaHandlers.handleQuickFix,
        
        handlePostNow: postingHandlers.handlePostNow,
        handleShareToThreadsChange: postingHandlers.handleShareToThreadsChange,
        
        handleBulkDelete: bulkHandlers.handleBulkDelete,
        handleBulkAddPosts,
        handleAddRow,
        
        handleImportFromScraper,
        
        handleSaveMediaToLibrary,
        handleDeleteMediaFromLibrary,
    };
};