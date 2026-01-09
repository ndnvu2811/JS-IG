import { useState, useEffect, useMemo, useCallback } from 'react';
import { InstagramAccount, PostHistory, ReelHistory, CareHistory } from '../types';
import { 
    getPostsHistory, 
    getReelsHistory, 
    getCareHistory, 
    getCareSchedules, 
    deletePostHistory, 
    deleteReelHistory, 
    deleteCareSchedule,
    syncMissedStatusToHistory 
} from '../utils/historyUtils';

export const useScheduleCalendar = (selectedAccount: InstagramAccount | null) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [postsHistory, setPostsHistory] = useState<PostHistory[]>([]);
    const [reelsHistory, setReelsHistory] = useState<ReelHistory[]>([]);
    const [careHistory, setCareHistory] = useState<CareHistory[]>([]);
    const [careSchedules, setCareSchedules] = useState<any[]>([]);

    // ✅ FIX #1: Đưa checkMissedSchedules vào useCallback
    const checkMissedSchedules = useCallback(() => {
        try {
            const schedulesRaw = localStorage.getItem('care-activity-schedules');
            if (!schedulesRaw) return;
            
            const schedules = JSON.parse(schedulesRaw);
            const now = new Date();
            let hasChanges = false;
            
            const updated = schedules.map((schedule: any) => {
                // Bỏ qua nếu đã completed hoặc missed
                if (schedule.status === 'Completed' || schedule.status === 'Missed') {
                    return schedule;
                }
                
                // Check nếu thời gian đã qua
                const scheduleDate = new Date(schedule.schedule.date);
                const lastTime = schedule.schedule.times[schedule.schedule.times.length - 1];
                const [hours, minutes] = lastTime.split(':').map(Number);
                scheduleDate.setHours(hours, minutes, 0, 0);
                
                // Thêm buffer 5 phút trước khi đánh dấu missed
                const bufferTime = 5 * 60 * 1000; // 5 minutes
                if (now.getTime() > scheduleDate.getTime() + bufferTime) {
                    hasChanges = true;
                    return {
                        ...schedule,
                        status: 'Missed'
                    };
                }
                
                return schedule;
            });
            
            if (hasChanges) {
                localStorage.setItem('care-activity-schedules', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('storage-change'));
            }
        } catch (error) {
            console.error('Error checking missed schedules:', error);
        }
    }, []);

    // ✅ Load History data từ localStorage
    useEffect(() => {
        const loadData = () => {
            try {
                // ✅ Đồng bộ Missed status trước khi load
                syncMissedStatusToHistory();
                
                setPostsHistory(getPostsHistory());
                setReelsHistory(getReelsHistory());
                setCareHistory(getCareHistory());
                setCareSchedules(getCareSchedules());
            } catch (error) {
                console.error("Could not load history data:", error);
                setPostsHistory([]);
                setReelsHistory([]);
                setCareHistory([]);
                setCareSchedules([]);
            }
        };
        
        loadData();
        
        const handleStorageChange = () => loadData();
        window.addEventListener('storage-change', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage-change', handleStorageChange);
        };
    }, []);

    // ✅ FIX #2: Check missed schedules trong useEffect, không phải render body
    useEffect(() => {
        // Check ngay khi mount
        checkMissedSchedules();
        
        // Check mỗi phút
        const interval = setInterval(checkMissedSchedules, 60000);
        
        return () => clearInterval(interval);
    }, [checkMissedSchedules]);

    // ✅ Lọc Posts History theo account (nếu có chọn account)
    const filteredPosts = useMemo(() => {
        if (!selectedAccount) return postsHistory; // Tất cả accounts
        return postsHistory.filter(p => p.account === selectedAccount.username);
    }, [postsHistory, selectedAccount]);

    // ✅ Lọc Reels History theo account (nếu có chọn account)
    const filteredReels = useMemo(() => {
        if (!selectedAccount) return reelsHistory; // Tất cả accounts
        return reelsHistory.filter(r => r.account === selectedAccount.username);
    }, [reelsHistory, selectedAccount]);

    // ✅ FIX #3: Expand care schedules - KHÔNG loop times, mỗi schedule = 1 activity
    const expandedCareSchedules = useMemo(() => {
        const allAccountsRaw = localStorage.getItem('instagram-accounts');
        const allAccounts = allAccountsRaw ? JSON.parse(allAccountsRaw) : [];
        
        const activities: CareHistory[] = [];
        
        careSchedules.forEach(schedule => {
            const accountIds = [
                ...(schedule.settings.autoBrowseAccounts || []),
                ...(schedule.settings.autoFollowAccounts || [])
            ];
            
            const accountNames = accountIds
                .map((id: number) => allAccounts.find((a: any) => a.id === id)?.username)
                .filter((name: string | undefined) => name !== undefined);
            
            // ✅ FIXED: Chỉ tạo 1 activity cho mỗi schedule (không loop times)
            // Lấy time đầu tiên làm đại diện để hiển thị
            const firstTime = schedule.schedule.times[0] || '00:00';
            
            activities.push({
                id: schedule.id,  // ✅ Dùng schedule.id gốc (không thêm suffix)
                scheduleId: schedule.id,
                originalScheduleId: schedule.id,
                accounts: accountNames,
                settings: schedule.settings,
                scheduledAt: `${schedule.schedule.date}T${firstTime}:00`,
                executedAt: schedule.completedAt,
                status: schedule.status || 'Scheduled',
                schedule: schedule.schedule,
                createdAt: schedule.createdAt || new Date().toISOString(),
            } as CareHistory);
        });
        
        return activities;
    }, [careSchedules]);

    // ✅ Merge expanded schedules + care history (Run Now)
    const allCareActivities = useMemo(() => {
        // Tránh duplicate: care history có thể đã có record cho schedule
        const scheduleIds = new Set(expandedCareSchedules.map(s => s.scheduleId));
        const filteredHistory = careHistory.filter(h => !h.originalScheduleId || !scheduleIds.has(h.originalScheduleId));
        
        return [...expandedCareSchedules, ...filteredHistory];
    }, [expandedCareSchedules, careHistory]);

    // ✅ Lọc Care theo account (nếu có chọn account)
    const filteredCare = useMemo(() => {
        if (!selectedAccount) return allCareActivities;
        return allCareActivities.filter(c => c.accounts.includes(selectedAccount.username));
    }, [allCareActivities, selectedAccount]);

    // ✅ Tính toán Calendar Grid (35-42 ô)
    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const grid = [];

        // Add empty cells for previous month's days
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.push({ key: `prev-${i}`, day: null });
        }

        // Add cells for current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            grid.push({ key: new Date(year, month, day).toISOString(), day });
        }
        
        // Add empty cells to fill the grid (usually up to 6 weeks or 42 cells)
        const remaining = 42 - grid.length;
        for (let i = 0; i < remaining; i++) {
            grid.push({ key: `next-${i}`, day: null });
        }

        return grid;
    }, [currentDate]);

    // ✅ Phân loại Posts vào từng ngày
    const postsByDay = useMemo(() => {
        const postsMap = new Map<number, PostHistory[]>();
        
        filteredPosts.forEach(post => {
            // Ưu tiên postedAt, nếu không có thì dùng scheduledAt
            const dateString = post.postedAt || post.scheduledAt;
            if (!dateString) return;
            
            const postDate = new Date(dateString);
            if (isNaN(postDate.getTime())) return;
            
            // Chỉ lấy posts của tháng hiện tại
            if (postDate.getMonth() === currentDate.getMonth() && 
                postDate.getFullYear() === currentDate.getFullYear()) {
                const day = postDate.getDate();
                if (!postsMap.has(day)) {
                    postsMap.set(day, []);
                }
                postsMap.get(day)?.push(post);
            }
        });
        
        return postsMap;
    }, [filteredPosts, currentDate]);

    // ✅ Phân loại Reels vào từng ngày
    const reelsByDay = useMemo(() => {
        const reelsMap = new Map<number, ReelHistory[]>();
        
        filteredReels.forEach(reel => {
            const dateString = reel.postedAt || reel.scheduledAt;
            if (!dateString) return;
            
            const reelDate = new Date(dateString);
            if (isNaN(reelDate.getTime())) return;
            
            if (reelDate.getMonth() === currentDate.getMonth() && 
                reelDate.getFullYear() === currentDate.getFullYear()) {
                const day = reelDate.getDate();
                if (!reelsMap.has(day)) {
                    reelsMap.set(day, []);
                }
                reelsMap.get(day)?.push(reel);
            }
        });
        
        return reelsMap;
    }, [filteredReels, currentDate]);

    // ✅ Phân loại Care Activities vào từng ngày
    const careByDay = useMemo(() => {
        const careMap = new Map<number, CareHistory[]>();
        
        filteredCare.forEach(care => {
            const dateString = care.executedAt || care.scheduledAt;
            if (!dateString) return;
            
            const careDate = new Date(dateString);
            if (isNaN(careDate.getTime())) return;
            
            if (careDate.getMonth() === currentDate.getMonth() && 
                careDate.getFullYear() === currentDate.getFullYear()) {
                const day = careDate.getDate();
                if (!careMap.has(day)) {
                    careMap.set(day, []);
                }
                careMap.get(day)?.push(care);
            }
        });
        
        return careMap;
    }, [filteredCare, currentDate]);

    // ✅ Chuyển tháng trước
    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    // ✅ Chuyển tháng sau
    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    // ✅ Kiểm tra có phải ngày hôm nay không
    const isToday = (day: number | null) => {
        if (!day) return false;
        const today = new Date();
        return day === today.getDate() && 
               currentDate.getMonth() === today.getMonth() &&
               currentDate.getFullYear() === today.getFullYear();
    };

    // ✅ FIX #4: Xóa item - handle cả schedule ID có suffix và không có suffix
    const handleDeleteItem = useCallback((itemId: string, itemType: 'post' | 'reel' | 'care') => {
        try {
            if (itemType === 'post') {
                deletePostHistory(itemId);
                setPostsHistory(getPostsHistory());
            } else if (itemType === 'reel') {
                deleteReelHistory(itemId);
                setReelsHistory(getReelsHistory());
            } else if (itemType === 'care') {
                // Check if it's a history item (Run Now) or schedule item
                if (itemId.startsWith('care_history_') || itemId.startsWith('run_now_')) {
                    // It's a history item (Run Now)
                    const history = getCareHistory();
                    const filtered = history.filter(h => h.id !== itemId);
                    localStorage.setItem('care-history', JSON.stringify(filtered));
                    setCareHistory(filtered);
                } else {
                    // ✅ FIXED: Extract original schedule ID (remove time suffix if present)
                    // Pattern: "care_schedule_123_10:30" -> "care_schedule_123"
                    const scheduleIdMatch = itemId.match(/^(care_schedule_\d+)/);
                    const originalScheduleId = scheduleIdMatch ? scheduleIdMatch[1] : itemId;
                    
                    console.log('🗑️ Deleting care schedule:', { itemId, originalScheduleId });
                    
                    deleteCareSchedule(originalScheduleId);
                    setCareSchedules(getCareSchedules());
                }
            }
            
            // Dispatch event để các component khác cập nhật
            window.dispatchEvent(new CustomEvent('storage-change'));
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    }, []);
    
    // ✅ Lấy tên tháng/năm
    const getMonthName = (date: Date) => {
        return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    };

    return {
        currentDate,
        postsByDay,
        reelsByDay,
        careByDay,
        calendarGrid,
        getMonthName,
        handlePrevMonth,
        handleNextMonth,
        isToday,
        handleDeleteItem
    };
};