import { Post, PostStatus, InstagramAccount } from '../../types';
import { savePostToHistory } from '../../utils/historyUtils';

export const useContentScheduling = (
    posts: Post[], 
    setPosts: (posts: any) => void, 
    selectedPostIds: Set<number>, 
    setSelectedPostIds: (ids: Set<number>) => void,
    accounts?: InstagramAccount[]
) => {
    
    /**
     * ✅ Helper: Sync posts to Electron scheduler
     */
    const syncToElectron = async (updatedPosts: Post[]) => {
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI?.syncPosts) {
            console.warn('⚠️ electronAPI.syncPosts not available');
            return;
        }

        // ✅ Filter and format posts for scheduler
        const scheduledPosts = updatedPosts
            .filter((p: Post) => 
                (p.status === PostStatus.Scheduled || p.status === PostStatus.Failed) && 
                p.scheduledTime
            )
            .map((p: Post) => {
                const postAccount = accounts?.find(acc => acc.username === p.account);
                
                return {
                    id: p.id,
                    caption: p.content,
                    media: p.media,
                    scheduledTime: p.scheduledTime,
                    status: p.status === PostStatus.Failed ? 'Failed' : 'Scheduled',
                    username: p.account,
                    cookies: [],
                    cookiesPath: postAccount?.cookiesPath,
                    shareToThreads: p.shareToThreads || false,
                };
            });

        console.log(`\n📤 ====== SCHEDULING: SYNCING ${scheduledPosts.length} POSTS ======`);
        scheduledPosts.forEach((p, i) => {
            console.log(`   [${i}] ID: ${p.id}, User: ${p.username}, CookiesPath: ${p.cookiesPath ? '✅' : '❌'}, Time: ${p.scheduledTime}`);
        });

        try {
            await electronAPI.syncPosts(scheduledPosts);
            console.log('✅ Synced to Electron scheduler');
        } catch (err) {
            console.error('❌ Sync error:', err);
        }
    };

    /**
     * ✅ Handle single post schedule change
     */
    const handleScheduleChange = async (postId: number, scheduledTime: string | undefined) => {
        console.log(`\n📅 handleScheduleChange: postId=${postId}, time=${scheduledTime}`);
        
        const updatedPosts = posts.map(post => {
            if (post.id === postId) {
                const updatedPost = {
                    ...post,
                    scheduledTime,
                    status: scheduledTime ? PostStatus.Scheduled : PostStatus.Draft,
                    updatedAt: new Date().toISOString(),
                };
                
                if (scheduledTime) {
                    savePostToHistory(updatedPost);
                }
                
                return updatedPost;
            }
            return post;
        });
        
        // ✅ Update React state
        setPosts(updatedPosts);

        // ✅ CRITICAL: Sync with Electron scheduler
        await syncToElectron(updatedPosts);
    };

    /**
     * ✅ Handle bulk schedule
     */
    const handleConfirmAdvancedBulkSchedule = async (settings: { startDate: string; postsPerDay: number; timeSlots: string[] }) => {
        const { startDate, timeSlots } = settings;
        const selectedIdsArray = Array.from(selectedPostIds);

        console.log(`\n📅 Bulk scheduling ${selectedIdsArray.length} posts...`);

        let postIndex = 0;
        const currentDate = new Date(`${startDate}T00:00:00`);

        const updatedPosts = posts.map(p => ({ ...p }));

        while (postIndex < selectedIdsArray.length) {
            for (const time of timeSlots) {
                if (postIndex >= selectedIdsArray.length) break;

                const postIdToSchedule = selectedIdsArray[postIndex];
                const [hours, minutes] = time.split(':').map(Number);

                const scheduleDateTime = new Date(currentDate);
                scheduleDateTime.setHours(hours, minutes, 0, 0);

                const postToUpdateIndex = updatedPosts.findIndex(p => p.id === postIdToSchedule);

                if (postToUpdateIndex !== -1) {
                    updatedPosts[postToUpdateIndex].status = PostStatus.Scheduled;
                    updatedPosts[postToUpdateIndex].scheduledTime = scheduleDateTime.toISOString();
                    updatedPosts[postToUpdateIndex].updatedAt = new Date().toISOString();
                    
                    savePostToHistory(updatedPosts[postToUpdateIndex]);
                    
                    console.log(`   ✅ Post ${postIdToSchedule} → ${scheduleDateTime.toLocaleString()}`);
                }

                postIndex++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // ✅ Update React state
        setPosts(updatedPosts);
        setSelectedPostIds(new Set());

        // ✅ CRITICAL: Sync with Electron scheduler
        await syncToElectron(updatedPosts);
    };

    /**
     * ✅ Handle bulk clear schedule
     */
    const handleBulkClearSchedule = async () => {
        console.log(`\n🗑️ Clearing schedule for ${selectedPostIds.size} posts...`);
        
        const updatedPosts = posts.map(post =>
            selectedPostIds.has(post.id) && (post.status === PostStatus.Scheduled || post.status === PostStatus.Failed)
                ? { 
                    ...post, 
                    status: PostStatus.Draft, 
                    scheduledTime: undefined,
                    updatedAt: new Date().toISOString(),
                }
                : post
        );
        
        setPosts(updatedPosts);
        setSelectedPostIds(new Set());

        // ✅ CRITICAL: Sync with Electron scheduler
        await syncToElectron(updatedPosts);
    };

    return {
        handleScheduleChange,
        handleConfirmAdvancedBulkSchedule,
        handleBulkClearSchedule,
    };
};