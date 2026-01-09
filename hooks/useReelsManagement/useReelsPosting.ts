import { Reel, ReelStatus } from '../../types';

export const useReelsPosting = (reels: Reel[], setReels: (reels: any) => void) => {
    
    const handlePostNow = async (reelId: number, selectedAccount: any) => {
        const reel = reels.find(r => r.id === reelId);
        if (!reel || !reel.content.trim() || !reel.video?.url || !selectedAccount) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const cookies = await (window as any).electronAPI.loadCookies(selectedAccount.cookiesPath);
            
            if (!cookies || cookies.length === 0) {
                console.error('❌ Cookies empty or invalid');
                return;
            }

            const reelData = {
                reelId: reel.id,
                content: reel.content,
                video: reel.video,
                shareToThreads: reel.shareToThreads,
                aspectRatio: reel.aspectRatio || '9:16',
                username: selectedAccount.username,
                cookies: cookies,
                cookiesPath: selectedAccount.cookiesPath,
            };

            setReels((prev: Reel[]) => prev.map(r => r.id === reelId ? { ...r, status: ReelStatus.Posting } : r));
            
            const electronAPI = (window as any).electronAPI;
            if (electronAPI?.postReelToInstagram) {
                electronAPI.postReelToInstagram(reelData);
            }
        } catch (error) {
            console.error('❌ Error loading cookies:', error);
        }
    };

    const handleShareToThreadsChange = (reelId: number, value: boolean) => {
        setReels((prev: Reel[]) =>
            prev.map(r => (r.id === reelId ? { ...r, shareToThreads: value, updatedAt: new Date().toISOString() } : r))
        );
    };

    return {
        handlePostNow,
        handleShareToThreadsChange,
    };
};
