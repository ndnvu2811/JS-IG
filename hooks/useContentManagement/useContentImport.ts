import { Post, PostStatus, InstagramAccount } from '../../types';

export const useContentImport = (posts: Post[], setPosts: (posts: any) => void) => {
    
    const handleImportFromScraper = (items: any[], selectedAccount: InstagramAccount | null) => {
        if (!selectedAccount) {
            console.error('❌ No account selected for import');
            return;
        }
        
        console.log('🔍 Raw scraper items:', items);
        console.log('🔍 Item 0 keys:', Object.keys(items[0] || {}));
        console.log('🔍 Item 0 caption:', items[0]?.caption);
        console.log('🔍 Item 0 captionNew:', items[0]?.captionNew);
        console.log('🔍 Item 0 media:', items[0]?.media);
        
        const newPosts = items.map((item, index) => {
            const maxId = Math.max(...posts.map(p => p.id), 0);
            
            // ✅ Fix: Extract caption properly
            const caption = item.captionNew || item.caption || '';
            const mediaArray = item.media || [];
            
            console.log(`📝 Item ${index}: caption="${caption.substring(0, 50)}...", media=${mediaArray.length}`);
            
            const post: Post = {
                id: maxId + index + 1,
                account: selectedAccount.username,
                content: caption,
                media: mediaArray.map((m: any) => ({
                    type: m.type === 'video' ? 'video' : 'image',
                    url: m.url || m.localPath || ''
                })),
                scheduledTime: '',
                status: PostStatus.Draft,
                type: 'Post',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                shareToThreads: false
            };
            
            console.log(`✅ Post ${index} final:`, { id: post.id, account: post.account, contentLength: post.content.length, mediaCount: post.media.length });
            return post;
        });
        
        console.log('📥 Final posts to import:', newPosts.length);
        
        setPosts((prevPosts: Post[]) => {
            const updated = [...prevPosts, ...newPosts];
            console.log('📊 Total posts after import:', updated.length);
            const accountPosts = updated.filter(p => p.account === selectedAccount.username);
            console.log('📊 Posts of account', selectedAccount.username + ':', accountPosts.length);
            const postsWithContent = accountPosts.filter(p => p.content.length > 0);
            console.log('📊 Posts with content:', postsWithContent.length);
            return updated;
        });
    };

    return {
        handleImportFromScraper,
    };
};
