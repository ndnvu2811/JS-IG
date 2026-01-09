import { Reel, ReelStatus } from '../../types';
import { saveReelToHistory } from '../../utils/historyUtils';

export const useReelsScheduling = (reels: Reel[], setReels: (reels: any) => void, selectedReelIds: Set<number>) => {
    
    const handleScheduleChange = async (reelId: number, dateTime: string) => {
        let updatedReels: Reel[] = [];
        
        setReels((prev: Reel[]) => {
            updatedReels = prev.map(r => {
                if (r.id !== reelId) return r;
                if (dateTime) {
                    const updatedReel = { 
                        ...r, 
                        status: ReelStatus.Scheduled, 
                        scheduledTime: new Date(dateTime).toISOString(), 
                        updatedAt: new Date().toISOString() 
                    };
                    
                    // ✅ Lưu vào History
                    saveReelToHistory(updatedReel);
                    
                    return updatedReel;
                } else {
                    return { 
                        ...r, 
                        status: ReelStatus.Draft, 
                        scheduledTime: undefined, 
                        updatedAt: new Date().toISOString() 
                    };
                }
            });
            return updatedReels;
        });
    };

    const handleConfirmAdvancedBulkSchedule = async (
        settings: { startDate: string; postsPerDay: number; timeSlots: string[] }
    ) => {
        const { startDate, timeSlots } = settings;
        const selectedIdsArray = Array.from(selectedReelIds);
        const updatedReels = [...reels];
        const currentDate = new Date(`${startDate}T00:00:00`);
        let reelIndex = 0;

        while (reelIndex < selectedIdsArray.length) {
            for (const time of timeSlots) {
                if (reelIndex >= selectedIdsArray.length) break;

                const [hours, minutes] = time.split(':').map(Number);
                const scheduleDateTime = new Date(currentDate);
                scheduleDateTime.setHours(hours, minutes, 0, 0);

                const idx = updatedReels.findIndex(r => r.id === selectedIdsArray[reelIndex]);
                if (idx !== -1) {
                    updatedReels[idx].status = ReelStatus.Scheduled;
                    updatedReels[idx].scheduledTime = scheduleDateTime.toISOString();
                    updatedReels[idx].updatedAt = new Date().toISOString();

                    // ✅ Lưu vào History
                    saveReelToHistory(updatedReels[idx]);
                }
                reelIndex++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        setReels(updatedReels);
    };

    const handleBulkClearSchedule = () => {
        setReels((prev: Reel[]) =>
            prev.map(r =>
                selectedReelIds.has(r.id) && r.status === ReelStatus.Scheduled
                    ? { ...r, status: ReelStatus.Draft, scheduledTime: undefined, updatedAt: new Date().toISOString() }
                    : r
            )
        );
    };

    return {
        handleScheduleChange,
        handleConfirmAdvancedBulkSchedule,
        handleBulkClearSchedule,
    };
};
