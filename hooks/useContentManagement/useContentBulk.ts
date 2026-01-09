import { Post, PostStatus, InstagramAccount } from '../../types';

export const useContentBulk = (posts: Post[], setPosts: (posts: any) => void, selectedPostIds: Set<number>) => {
    
    const handleBulkDelete = async () => {
        if (selectedPostIds.size === 0) return;
        
        // Delete media files first
        const postsToDelete = posts.filter(p => selectedPostIds.has(p.id));
        
        for (const post of postsToDelete) {
            for (const mediaItem of post.media) {
                if (mediaItem.url.startsWith('/') || mediaItem.url.includes('user-media') || mediaItem.url.includes('content-media')) {
                    try {
                        await (window as any).electronAPI?.deleteMediaFile(mediaItem.url);
                    } catch (error) {
                        console.error('Failed to delete media:', error);
                    }
                }
            }
        }
        
        // Delete posts
        const updatedPosts = posts.filter(post => !selectedPostIds.has(post.id));
        setPosts(updatedPosts);
        selectedPostIds.clear();
        
        const electronAPI = (window as any).electronAPI;
        if (electronAPI?.syncPosts) {
            await electronAPI.syncPosts(updatedPosts);
        }
    };

    const handleBulkAddPosts = (
        parsedData: Array<{ content: string; media: { type: 'image' | 'video'; url: string }[] }>,
        selectedAccount: InstagramAccount | null
    ) => {
        if (!selectedAccount) return;
        
        setPosts((prevPosts: Post[]) => {
            let updatedPosts = [...prevPosts];
            let lastId = prevPosts.reduce((maxId, post) => Math.max(post.id, maxId), 0);

            const emptyPostIndices: number[] = [];
            updatedPosts.forEach((post, index) => {
                if (post.account === selectedAccount.username && post.content.trim() === '' && post.media.length === 0) {
                    emptyPostIndices.push(index);
                }
            });

            const postsToFill = parsedData.slice(0, emptyPostIndices.length);
            const postsToAppend = parsedData.slice(emptyPostIndices.length);

            postsToFill.forEach((data, i) => {
                const postIndexToUpdate = emptyPostIndices[i];
                updatedPosts[postIndexToUpdate] = {
                    ...updatedPosts[postIndexToUpdate],
                    content: data.content,
                    media: data.media,
                    status: PostStatus.Draft,
                    updatedAt: new Date().toISOString(),
                };
            });

            const newPosts: Post[] = postsToAppend.map((data) => {
                lastId++;
                return {
                    id: lastId,
                    content: data.content,
                    media: data.media,
                    status: PostStatus.Draft,
                    account: selectedAccount.username,
                    type: 'Post',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    shareToThreads: false,
                };
            });

            return [...updatedPosts, ...newPosts];
        });
    };

    const handleAddRow = (selectedAccount: InstagramAccount | null) => {
        if (!selectedAccount) return;
        const lastId = posts.reduce((maxId, post) => Math.max(post.id, maxId), 0);
        const newPost: Post = {
            id: lastId + 1,
            content: '',
            media: [],
            status: PostStatus.Draft,
            account: selectedAccount.username,
            type: 'Post',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            shareToThreads: false,
        };
        setPosts((prev: Post[]) => [...prev, newPost]);
    };

    return {
        handleBulkDelete,
        handleBulkAddPosts,
        handleAddRow,
    };
};
