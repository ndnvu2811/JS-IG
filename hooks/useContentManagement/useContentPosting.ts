import { Post, PostStatus, InstagramAccount } from '../../types';

export const useContentPosting = (posts: Post[], setPosts: (posts: any) => void, accounts: InstagramAccount[]) => {
    
    const handlePostNow = async (postId: number) => {
        const postToPublish = posts.find(p => p.id === postId);
        if (!postToPublish) return;

        const account = accounts.find(acc => acc.username === postToPublish.account);
        if (!account) {
            alert('Account not found');
            return;
        }

        if (!account.cookiesPath) {
            alert('Please re-login to this account');
            return;
        }

        if (postToPublish.media.length === 0) {
            alert('Please add at least one image or video');
            return;
        }

        // Update status to Posting
        setPosts((prevPosts: Post[]) =>
            prevPosts.map(p =>
                p.id === postId
                    ? { ...p, status: PostStatus.Posting, updatedAt: new Date().toISOString() }
                    : p
            )
        );

        // Send to Electron
        const electronAPI = (window as any).electronAPI;
        if (electronAPI?.postToInstagram) {
            electronAPI.postToInstagram({
                postId: postId,
                content: postToPublish.content,
                media: postToPublish.media,
                cookiesPath: account.cookiesPath,
                shareToThreads: postToPublish.shareToThreads || false,
                username: account.username,
            });
        }
    };

    const handleShareToThreadsChange = (postId: number, value: boolean) => {
        setPosts((prevPosts: Post[]) =>
            prevPosts.map(post =>
                post.id === postId 
                    ? { ...post, shareToThreads: value, updatedAt: new Date().toISOString() } 
                    : post
            )
        );
    };

    return {
        handlePostNow,
        handleShareToThreadsChange,
    };
};
