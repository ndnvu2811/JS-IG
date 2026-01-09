import { useMemo } from 'react';
import { Post, PostStatus, InstagramAccount } from '../../types';

export const useContentSelection = (posts: Post[], selectedAccount: InstagramAccount | null, filter: string) => {

    const filteredPosts = useMemo(() => {
        let filtered = posts;
        
        if (selectedAccount) {
            filtered = filtered.filter(p => p.account === selectedAccount.username);
        }
        
        if (filter !== 'All') {
            filtered = filtered.filter(p => p.status === filter);
        }
        
        // ✅ Sort posts - posts with content first, then empty rows
        filtered = filtered.sort((a, b) => {
            const aHasContent = a.content && a.content.trim().length > 0 ? 1 : 0;
            const bHasContent = b.content && b.content.trim().length > 0 ? 1 : 0;
            return bHasContent - aHasContent; // Content posts first
        });
        
        console.log(`🔍 FilteredPosts memoized: total posts=${posts.length}, account=${selectedAccount?.username}, filter=${filter}`);
        console.log(`🔍 Final filteredPosts count: ${filtered.length}`);
        
        return filtered;
    }, [posts, selectedAccount, filter]);

    const handleSelectPost = (postId: number, selectedPostIds: Set<number>, setSelectedPostIds: (ids: Set<number>) => void) => {
        const newSet = new Set(selectedPostIds);
        if (newSet.has(postId)) {
            newSet.delete(postId);
        } else {
            newSet.add(postId);
        }
        setSelectedPostIds(newSet);
    };

    const handleSelectAll = (selectedPostIds: Set<number>, setSelectedPostIds: (ids: Set<number>) => void) => {
        if (selectedPostIds.size === filteredPosts.length) {
            setSelectedPostIds(new Set());
        } else {
            setSelectedPostIds(new Set(filteredPosts.map(p => p.id)));
        }
    };

    return {
        filteredPosts,
        handleSelectPost,
        handleSelectAll,
    };
};
