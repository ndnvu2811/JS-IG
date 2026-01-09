import { Post, PostType } from '../../types';
import { syncMediaToLibrary, removeMediaFromLibrary, setEditorImagesFromContent } from '../../utils/library';

export const useContentMedia = (posts: Post[], setPosts: (posts: any) => void, filteredPosts: Post[]) => {
    
    const handleContentChange = (postId: number, content: string) => {
        setPosts((prevPosts: Post[]) =>
            prevPosts.map(post =>
                post.id === postId 
                    ? { ...post, content, updatedAt: new Date().toISOString() } 
                    : post
            )
        );
    };

    const handleTypeChange = (postId: number, type: PostType) => {
        setPosts((prevPosts: Post[]) =>
            prevPosts.map(post =>
                post.id === postId 
                    ? { ...post, type, updatedAt: new Date().toISOString() } 
                    : post
            )
        );
    };

    const handleMediaChange = async (postId: number, media: { type: 'image' | 'video'; url: string }[]) => {
        console.log('🎯 handleMediaChange called - postId:', postId, 'media count:', media.length);
        
        // Find post and get rowNumber
        const post = posts.find(p => p.id === postId);
        const postIndex = filteredPosts.findIndex(p => p.id === postId) + 1;
        const rowNumber = post?.rowNumber ?? postIndex;
        
        console.log('🎯 Found post:', post?.id, 'rowNumber:', rowNumber);
        
        // Remove old media from Library first
        await removeMediaFromLibrary(rowNumber, 'Post');
        
        // Update post with new media
        setPosts((prevPosts: Post[]) =>
            prevPosts.map(p =>
                p.id === postId 
                    ? { ...p, media, rowNumber, updatedAt: new Date().toISOString() } 
                    : p
            )
        );
        
        console.log('✅ Post media updated in state');

        // Auto-save to Media Library if media exists
        if (media.length > 0) {
            try {
                const postType = post?.type || 'Post';
                await syncMediaToLibrary(rowNumber, media, postType);
                console.log(`✅ Auto-saved ${media.length} media to Library as ${postType}_${rowNumber}`);
            } catch (error) {
                console.error('❌ Auto-save media failed:', error);
            }
        }
    };

    const handleMediaRemove = async (postId: number, newMedia: { type: 'image' | 'video'; url: string }[]) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        const postIndex = filteredPosts.findIndex(p => p.id === postId) + 1;
        const rowNumber = post?.rowNumber ?? postIndex;
        
        // Remove old media from Library
        await removeMediaFromLibrary(rowNumber, post.type || 'Post');
        
        // If there's new media, sync again
        if (newMedia.length > 0) {
            await syncMediaToLibrary(rowNumber, newMedia, post.type || 'Post');
        }
    };

    const handleRowNumberChange = (postId: number, rowNumber: number) => {
        setPosts((prevPosts: Post[]) =>
            prevPosts.map(post =>
                post.id === postId 
                    ? { ...post, rowNumber, updatedAt: new Date().toISOString() } 
                    : post
            )
        );
    };

    const handleSaveMediaToLibrary = async (postId: number) => {
        const post = posts.find(p => p.id === postId);
        if (!post || post.media.length === 0) {
            alert('No media to save');
            return;
        }

        try {
            // Sync media to library
            await syncMediaToLibrary(postId, post.media, post.type);
            
            // Update post with batchName
            const batchName = `${post.type}_${postId}`;
            setPosts((prevPosts: Post[]) =>
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

    const handleQuickFix = async (postId: number) => {
        const post = posts.find(p => p.id === postId);
        if (!post || post.media.length === 0) return;
        
        // Filter only images (not videos)
        const imageUrls = post.media
            .filter(m => m.type === 'image')
            .map(m => m.url);
        
        if (imageUrls.length === 0) {
            alert('No images to edit. Only images can be edited in Image Editor.');
            return;
        }
        
        // Calculate rowNumber same as handleMediaChange logic
        const postIndex = filteredPosts.findIndex(p => p.id === postId) + 1;
        const rowNumber = post?.rowNumber ?? postIndex;
        const postType = post?.type || 'Post';
        
        // Create batch name in format: "Post_1", "Reel_5", etc.
        const batchName = `${postType}_${rowNumber}`;
        
        // Set images to Editor Session
        await setEditorImagesFromContent(imageUrls);
        
        // Save postId and batch name
        console.log('🔧 Quick Fix - Setting sourcePostId:', postId, 'batchName:', batchName);
        localStorage.setItem('editor-source-post-id', postId.toString());
        localStorage.setItem('editor-batch-name', batchName);
        localStorage.setItem('editor-last-index', '0');
        
        // ✅ Navigate to Image Editor
        window.dispatchEvent(new CustomEvent('navigate-to-image-editor'));
    };

    return {
        handleContentChange,
        handleTypeChange,
        handleMediaChange,
        handleMediaRemove,
        handleRowNumberChange,
        handleSaveMediaToLibrary,
        handleDeleteMediaFromLibrary,
        handleQuickFix,
    };
};
