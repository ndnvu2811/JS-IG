import { Reel, ReelStatus } from '../../types';
import { syncMediaToLibrary, removeMediaFromLibrary } from '../../utils/library';

export const useReelsVideo = (reels: Reel[], setReels: (reels: any) => void, filteredReels: Reel[]) => {
    
    const handleRowNumberChange = (reelId: number, rowNumber: number) => {
        setReels((prev: Reel[]) =>
            prev.map(reel =>
                reel.id === reelId 
                    ? { ...reel, rowNumber, updatedAt: new Date().toISOString() } 
                    : reel
            )
        );
    };

    const handleContentChange = (reelId: number, content: string) => {
        setReels((prev: Reel[]) => prev.map(r => r.id === reelId ? { ...r, content, updatedAt: new Date().toISOString() } : r));
    };

    const handleVideoChange = async (reelId: number, video: { url: string }) => {
        // Tìm reel và lấy rowNumber
        const reel = reels.find(r => r.id === reelId);
        const reelIndex = filteredReels.findIndex(r => r.id === reelId) + 1;
        const rowNumber = reel?.rowNumber ?? reelIndex;
        
        // Xóa video cũ trong Library trước
        await removeMediaFromLibrary(rowNumber, 'Reel');
        
        // Update reel with new video
        setReels((prev: Reel[]) => prev.map(r => r.id === reelId ? { ...r, video, rowNumber, updatedAt: new Date().toISOString() } : r));

        // Auto-save to Media Library if video exists
        if (video.url) {
            try {
                await syncMediaToLibrary(rowNumber, [{ type: 'video', url: video.url }], 'Reel');
                console.log(`✅ Auto-saved video to Library as Reel_${rowNumber}`);
            } catch (error) {
                console.error('❌ Auto-save video failed:', error);
            }
        }
    };

    const handleDeleteReel = async (reelId: number) => {
        const reel = reels.find(r => r.id === reelId);
        if (!reel) return;
        
        // Xóa video file
        if (reel.video.url && (reel.video.url.includes('user-media') || reel.video.url.includes('content-media'))) {
            try {
                await (window as any).electronAPI?.deleteMediaFile(reel.video.url);
                console.log('✅ Video file deleted');
            } catch (error) {
                console.error('Failed to delete video:', error);
            }
        }
        
        // Xóa reel khỏi state
        setReels((prev: Reel[]) => prev.filter(r => r.id !== reelId));
    };

    const handleSaveVideoToLibrary = async (reelId: number) => {
        const reel = reels.find(r => r.id === reelId);
        if (!reel || !reel.video.url) {
            alert('No video to save');
            return;
        }

        try {
            // Sync video vào library (như media item)
            await syncMediaToLibrary(reelId, [{ type: 'video', url: reel.video.url }], 'Reel');
            
            // Cập nhật reel với batchName
            setReels((prevReels: Reel[]) =>
                prevReels.map(r =>
                    r.id === reelId
                        ? { ...r, batchName: `Reel_${reelId}`, updatedAt: new Date().toISOString() }
                        : r
                )
            );

            alert(`✅ Video saved to Library (Folder: Reel_${reelId})`);
        } catch (error) {
            console.error('Error saving video:', error);
            alert('Failed to save video to library');
        }
    };

    const handleDeleteVideoFromLibrary = async (reelId: number) => {
        try {
            await removeMediaFromLibrary(reelId, 'Reel');
        } catch (error) {
            console.error('Error removing video:', error);
        }
    };

    const handleBulkDelete = async (selectedReelIds: Set<number>) => {
        if (selectedReelIds.size === 0) return;

        // 1️⃣ Xoá file video trong thư mục media (nếu có)
        const reelsToDelete = reels.filter(r => selectedReelIds.has(r.id));
        for (const reel of reelsToDelete) {
            if (reel.video?.url && (reel.video.url.includes('user-media') || reel.video.url.includes('content-media'))) {
                try {
                    await (window as any).electronAPI?.deleteMediaFile(reel.video.url);
                } catch (error) {
                    console.error('Failed to delete video:', error);
                }
            }
        }

        // 2️⃣ Cập nhật lại list reels sau khi xoá
        const updatedReels = reels.filter(r => !selectedReelIds.has(r.id));
        setReels(updatedReels);
    };

    return {
        handleRowNumberChange,
        handleContentChange,
        handleVideoChange,
        handleDeleteReel,
        handleSaveVideoToLibrary,
        handleDeleteVideoFromLibrary,
        handleBulkDelete,
    };
};
