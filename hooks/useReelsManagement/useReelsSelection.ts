import { useState, useMemo } from 'react';
import { Reel, ReelStatus, InstagramAccount } from '../../types';

export const useReelsSelection = (reels: Reel[], selectedAccount: InstagramAccount | null, filter: string) => {
    const [selectedReelIds, setSelectedReelIds] = useState(new Set<number>());

    const filteredReels = useMemo(() => {
        if (!selectedAccount) return [];
        let filtered = reels.filter(reel => reel.account === selectedAccount.username);
        
        if (filter !== 'All') {
            filtered = filtered.filter(reel => reel.status === (ReelStatus as any)[filter]);
        }
        
        // ✅ Sort: Reels with content first, then empty rows
        filtered = filtered.sort((a, b) => {
            const aHasContent = a.content && a.content.trim().length > 0 ? 1 : 0;
            const bHasContent = b.content && b.content.trim().length > 0 ? 1 : 0;
            return bHasContent - aHasContent; // Content reels first
        });
        
        return filtered;
    }, [reels, filter, selectedAccount]);

    const handleSelectReel = (reelId: number) => {
        setSelectedReelIds(prev => {
            const newSelection = new Set(prev);
            newSelection.has(reelId) ? newSelection.delete(reelId) : newSelection.add(reelId);
            return newSelection;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedReelIds(e.target.checked ? new Set(filteredReels.map(r => r.id)) : new Set());
    };

    const isAllSelected = filteredReels.length > 0 && selectedReelIds.size === filteredReels.length;

    return {
        selectedReelIds,
        setSelectedReelIds,
        filteredReels,
        handleSelectReel,
        handleSelectAll,
        isAllSelected,
    };
};
