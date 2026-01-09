import { Reel } from '../../types';

export const useReelsImport = (reels: Reel[], setReels: (reels: any) => void) => {
    
    const handleImportFromScraper = (items: any[], selectedAccount: any) => {
        if (!selectedAccount) {
            console.error('❌ No account selected for import');
            return;
        }
        
        console.log('🎬 Importing videos from scraper:', items.length);
        
        const newReels = items.map((item, index) => {
            const maxId = Math.max(...reels.map(r => r.id), 0);
            
            // ✅ Extract caption and video URL
            const caption = item.captionNew || item.caption || '';
            const videoUrl = item.media?.[0]?.url || '';
            
            console.log(`📝 Video ${index}: caption="${caption.substring(0, 50)}...", url=${videoUrl ? '✅' : '❌'}`);
            
            const reel: Reel = {
                id: maxId + index + 1,
                account: selectedAccount.username,
                content: caption,
                video: {
                    url: videoUrl
                },
                status: 'Draft' as any,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                shareToThreads: false
            };
            
            console.log(`✅ Reel ${index} created:`, { id: reel.id, account: reel.account, contentLength: reel.content.length });
            return reel;
        });
        
        console.log('🎬 Final reels to import:', newReels.length);
        
        setReels((prevReels: Reel[]) => {
            const updated = [...prevReels, ...newReels];
            console.log('📊 Total reels after import:', updated.length);
            const accountReels = updated.filter(r => r.account === selectedAccount.username);
            console.log('📊 Reels of account', selectedAccount.username + ':', accountReels.length);
            return updated;
        });
    };

    return {
        handleImportFromScraper,
    };
};
