import { useEffect } from 'react';
import { InstagramAccount } from '../../types';
import { updatePostHistoryAsPosted, updateReelHistoryAsPosted } from '../../utils/historyUtils';

const getElectronAPI = () => {
    return (window as any).electronAPI;
};

export const useAppIpcListeners = (accounts: InstagramAccount[]) => {
    // ===================================================
    // ✅ GLOBAL: Listen for Post Success/Error (Post Now)
    // ===================================================
    useEffect(() => {
        const electronAPI = getElectronAPI();
        if (!electronAPI) return;

        console.log('🔗 [App] Setting up GLOBAL post listeners...');

        const handlePostSuccess = (data: { postId: number; postUrl: string }) => {
            console.log('✅ [App] Post success:', data);
            const postedTime = new Date().toISOString();
            
            try {
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
                    console.log('✅ Post updated in localStorage');
                }
            } catch (error) {
                console.error('❌ Error updating post:', error);
            }
        };

        const handlePostError = (data: { postId: number; error: string }) => {
            console.error('❌ Post error:', data);
            
            try {
                const savedPosts = localStorage.getItem('instagram-posts');
                if (savedPosts) {
                    const allPosts = JSON.parse(savedPosts);
                    const updatedPosts = allPosts.map((p: any) => {
                        if (p.id === data.postId) {
                            return { ...p, status: 'Failed', error: data.error };
                        }
                        return p;
                    });
                    localStorage.setItem('instagram-posts', JSON.stringify(updatedPosts));
                    window.dispatchEvent(new CustomEvent('storage-change'));
                }
            } catch (error) {
                console.error('❌ Error updating failed post:', error);
            }
        };

        let cleanupSuccess: (() => void) | undefined;
        let cleanupError: (() => void) | undefined;

        if (electronAPI.onPostSuccess) {
            cleanupSuccess = electronAPI.onPostSuccess(handlePostSuccess);
        }
        if (electronAPI.onPostError) {
            cleanupError = electronAPI.onPostError(handlePostError);
        }

        return () => {
            cleanupSuccess?.();
            cleanupError?.();
        };
    }, []);

    // ===================================================
    // ✅ GLOBAL: Listen for Reel Success/Error (Post Now)
    // ===================================================
    useEffect(() => {
        const electronAPI = getElectronAPI();
        if (!electronAPI) return;

        console.log('🔗 [App] Setting up GLOBAL reel listeners...');

        const handleReelSuccess = (data: { reelId: number; reelUrl: string }) => {
            console.log('✅ Reel success:', data);
            const postedTime = new Date().toISOString();
            
            try {
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
                    window.dispatchEvent(new CustomEvent('storage-change'));
                    updateReelHistoryAsPosted(data.reelId, data.reelUrl, postedTime);
                    console.log('✅ Reel updated in localStorage');
                }
            } catch (error) {
                console.error('❌ Error updating reel:', error);
            }
        };

        const handleReelError = (data: { reelId: number; error: string }) => {
            console.error('❌ Reel error:', data);
            
            try {
                const savedReels = localStorage.getItem('instagram-reels');
                if (savedReels) {
                    const allReels = JSON.parse(savedReels);
                    const updatedReels = allReels.map((r: any) => {
                        if (r.id === data.reelId) {
                            return { ...r, status: 'Failed', error: data.error };
                        }
                        return r;
                    });
                    localStorage.setItem('instagram-reels', JSON.stringify(updatedReels));
                    window.dispatchEvent(new CustomEvent('storage-change'));
                }
            } catch (error) {
                console.error('❌ Error updating failed reel:', error);
            }
        };

        let cleanupSuccess: (() => void) | undefined;
        let cleanupError: (() => void) | undefined;

        if (electronAPI.onPostReelSuccess) {
            cleanupSuccess = electronAPI.onPostReelSuccess(handleReelSuccess);
        }
        if (electronAPI.onPostReelError) {
            cleanupError = electronAPI.onPostReelError(handleReelError);
        }

        return () => {
            cleanupSuccess?.();
            cleanupError?.();
        };
    }, []);

    // ===================================================
    // Listen for Post Publishing Events
    // ===================================================
    useEffect(() => {
        if (!window.electronAPI) return;

        const handlePostSuccess = (data: { postId: number; publishedAt: string; postUrl: string }) => {
            console.log('✅ Post published:', data);
            
            try {
                const postsRaw = localStorage.getItem('instagram-posts');
                if (!postsRaw) return;
                
                const posts = JSON.parse(postsRaw);
                const updated = posts.map((p: any) => {
                    if (p.id === data.postId) {
                        updatePostHistoryAsPosted(p.id, data.postUrl, data.publishedAt);
                        return { ...p, status: 'Posted', postedUrl: data.postUrl, updatedAt: data.publishedAt };
                    }
                    return p;
                });
                
                localStorage.setItem('instagram-posts', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('storage-change'));
            } catch (error) {
                console.error('Error updating post status:', error);
            }
        };

        const handlePostError = (data: { postId: number; error: string }) => {
            console.error('❌ Post error:', data);
            
            try {
                const postsRaw = localStorage.getItem('instagram-posts');
                if (!postsRaw) return;
                
                const posts = JSON.parse(postsRaw);
                const updated = posts.map((p: any) => {
                    if (p.id === data.postId) {
                        return { ...p, status: 'Failed', error: data.error, updatedAt: new Date().toISOString() };
                    }
                    return p;
                });
                
                localStorage.setItem('instagram-posts', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('storage-change'));
            } catch (error) {
                console.error('Error updating post error status:', error);
            }
        };

        const handlePostMissed = (data: { postId: number; missedAt: string }) => {
            console.log('⏰ Post missed:', data);
            
            try {
                const postsRaw = localStorage.getItem('instagram-posts');
                if (!postsRaw) return;
                
                const posts = JSON.parse(postsRaw);
                const updated = posts.map((p: any) => {
                    if (p.id === data.postId) {
                        return { ...p, status: 'Missed', missedAt: data.missedAt, updatedAt: data.missedAt };
                    }
                    return p;
                });
                
                localStorage.setItem('instagram-posts', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('storage-change'));
            } catch (error) {
                console.error('Error updating post missed status:', error);
            }
        };

        const handlePostStatusUpdate = (data: { postId: number; status: string }) => {
            console.log('🔄 Post status update:', data);
            
            try {
                const postsRaw = localStorage.getItem('instagram-posts');
                if (!postsRaw) return;
                
                const posts = JSON.parse(postsRaw);
                const updated = posts.map((p: any) => {
                    if (p.id === data.postId) {
                        return { ...p, status: data.status, updatedAt: new Date().toISOString() };
                    }
                    return p;
                });
                
                localStorage.setItem('instagram-posts', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('storage-change'));
            } catch (error) {
                console.error('Error updating post status:', error);
            }
        };

        if (window.electronAPI.onPostPublishingSuccess) window.electronAPI.onPostPublishingSuccess(handlePostSuccess);
        if (window.electronAPI.onPostPublishingError) window.electronAPI.onPostPublishingError(handlePostError);
        if (window.electronAPI.onPostMissed) window.electronAPI.onPostMissed(handlePostMissed);
        if (window.electronAPI.onPostStatusUpdate) window.electronAPI.onPostStatusUpdate(handlePostStatusUpdate);
    }, []);

    // ===================================================
    // Listen for Reel Publishing Events
    // ===================================================
    useEffect(() => {
        if (!window.electronAPI) return;

        const handleReelSuccess = (data: { reelId: number; publishedAt: string; reelUrl: string }) => {
            console.log('✅ Reel published:', data);
            
            try {
                const reelsRaw = localStorage.getItem('instagram-reels');
                if (!reelsRaw) return;
                
                const reels = JSON.parse(reelsRaw);
                const updated = reels.map((r: any) => {
                    if (r.id === data.reelId) {
                        updateReelHistoryAsPosted(r.id, data.reelUrl, data.publishedAt);
                        return { ...r, status: 'Posted', postedUrl: data.reelUrl, updatedAt: data.publishedAt };
                    }
                    return r;
                });
                
                localStorage.setItem('instagram-reels', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('storage-change'));
            } catch (error) {
                console.error('Error updating reel status:', error);
            }
        };

        const handleReelError = (data: { reelId: number; error: string }) => {
            console.error('❌ Reel error:', data);
            
            try {
                const reelsRaw = localStorage.getItem('instagram-reels');
                if (!reelsRaw) return;
                
                const reels = JSON.parse(reelsRaw);
                const updated = reels.map((r: any) => {
                    if (r.id === data.reelId) {
                        return { ...r, status: 'Failed', error: data.error, updatedAt: new Date().toISOString() };
                    }
                    return r;
                });
                
                localStorage.setItem('instagram-reels', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('storage-change'));
            } catch (error) {
                console.error('Error updating reel error status:', error);
            }
        };

        const handleReelMissed = (data: { reelId: number; missedAt: string }) => {
            console.log('⏰ Reel missed:', data);
            
            try {
                const reelsRaw = localStorage.getItem('instagram-reels');
                if (!reelsRaw) return;
                
                const reels = JSON.parse(reelsRaw);
                const updated = reels.map((r: any) => {
                    if (r.id === data.reelId) {
                        return { ...r, status: 'Missed', missedAt: data.missedAt, updatedAt: data.missedAt };
                    }
                    return r;
                });
                
                localStorage.setItem('instagram-reels', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('storage-change'));
            } catch (error) {
                console.error('Error updating reel missed status:', error);
            }
        };

        const handleReelStatusUpdate = (data: { reelId: number; status: string }) => {
            console.log('🔄 Reel status update:', data);
            
            try {
                const reelsRaw = localStorage.getItem('instagram-reels');
                if (!reelsRaw) return;
                
                const reels = JSON.parse(reelsRaw);
                const updated = reels.map((r: any) => {
                    if (r.id === data.reelId) {
                        return { ...r, status: data.status, updatedAt: new Date().toISOString() };
                    }
                    return r;
                });
                
                localStorage.setItem('instagram-reels', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('storage-change'));
            } catch (error) {
                console.error('Error updating reel status:', error);
            }
        };

        if (window.electronAPI.onReelPublishingSuccess) window.electronAPI.onReelPublishingSuccess(handleReelSuccess);
        if (window.electronAPI.onReelPublishingError) window.electronAPI.onReelPublishingError(handleReelError);
        if (window.electronAPI.onReelMissed) window.electronAPI.onReelMissed(handleReelMissed);
        if (window.electronAPI.onReelStatusUpdate) window.electronAPI.onReelStatusUpdate(handleReelStatusUpdate);
    }, []);
};
