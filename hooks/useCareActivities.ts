import { useState, useEffect, useMemo, useCallback } from 'react';
import { InstagramAccount, CareSettings, CareActivitySchedule } from '../types';
// ✅ REMOVED: saveCareToHistory import (không dùng ở đây nữa, chỉ dùng trong CareActivities.tsx cho Run Now)

interface OverviewDetail {
    title: string;
    summary: string;
    totalTime: number;
    accounts: InstagramAccount[];
    type: 'info' | 'warning';
}

const initialSettings: CareSettings = {
    // Auto-Browse (đã gộp Like và Comment)
    autoBrowseEnabled: true,
    autoBrowseAccounts: [],
    autoBrowseRunMode: 'parallel',
    autoBrowseDuration: 600,
    autoBrowseScrollInterval: 10,
    autoBrowseEnableLike: false,
    autoBrowseLikeCount: 5,
    
    // Auto-Follow
    autoFollowEnabled: false,
    autoFollowAccounts: [],
    autoFollowSource: 'followers',
    autoFollowTargetUsername: '',  // ✅ FIXED: was autoFollowTargetAccount
    autoFollowCount: 2,
    autoFollowEnableLike: false,   // ✅ ADDED
    autoFollowEnableComment: false, // ✅ ADDED
    autoFollowComments: [],        // ✅ ADDED
    // ✅ REMOVED: autoFollowDelay (not needed)
};

interface ModalConfig {
    activity: 'autoBrowse' | 'autoFollow';
    title: string;
}

export const useCareActivities = (accounts: InstagramAccount[]) => {
    const [settings, setSettings] = useState<CareSettings>(() => {
        try {
            const savedSettings = localStorage.getItem('care-settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                return { ...initialSettings, ...parsed };
            }
            return initialSettings;
        } catch (error) {
            console.error("Could not load care settings from localStorage", error);
            return initialSettings;
        }
    });

    // Lọc bỏ các account IDs không tồn tại
    useEffect(() => {
        const validAccountIds: number[] = accounts.map(acc => acc.id);  // ✅ EXPLICIT TYPE
        
        setSettings(prev => ({
            ...prev,
            autoBrowseAccounts: prev.autoBrowseAccounts.filter(id => validAccountIds.includes(id)),
            autoFollowAccounts: prev.autoFollowAccounts.filter(id => validAccountIds.includes(id)),
        }));
    }, [accounts]);

    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);

    useEffect(() => {
        try {
            localStorage.setItem('care-settings', JSON.stringify(settings));
        } catch (error) {
            console.error("Could not save care settings to localStorage", error);
        }
    }, [settings]);

    const overviewCalculations = useMemo(() => {
        const details: OverviewDetail[] = [];
        let grandTotal = 0;
        
        const getSelectedAccounts = (selectedIds: number[]) => {  // ✅ EXPLICIT TYPE
            return accounts.filter(acc => selectedIds.includes(acc.id));
        };

        // Auto-Browse (có kèm Like và Comment nếu được bật)
        if (settings.autoBrowseEnabled) {
            const selectedAccounts = getSelectedAccounts(settings.autoBrowseAccounts);
            if (selectedAccounts.length === 0) {
                details.push({ 
                    title: 'Auto-Browse Newfeed', 
                    summary: 'Select at least one account.', 
                    type: 'warning', 
                    accounts: [], 
                    totalTime: 0 
                });
            } else {
                const duration = settings.autoBrowseDuration;
                const runMode = settings.autoBrowseRunMode;
                
                // Tính tổng thời gian dựa trên run mode
                let totalTime = 0;
                if (runMode === 'parallel') {
                    totalTime = duration;
                } else {
                    totalTime = duration * selectedAccounts.length;
                }
                
                grandTotal += totalTime;
                
                // Tạo summary text
                let summary = `${selectedAccounts.length} account(s) will browse for ${duration}s each. `;
                
                if (settings.autoBrowseEnableLike) {
                    summary += `Auto-like enabled: up to ${settings.autoBrowseLikeCount} likes per account. `;
                }
                
                summary += `Run mode: ${runMode === 'parallel' ? 'Parallel (all at once)' : 'Sequential (one by one)'}.`;
                
                details.push({
                    title: 'Auto-Browse Newfeed',
                    summary: summary,
                    totalTime: totalTime,
                    accounts: selectedAccounts,
                    type: 'info'
                });
            }
        }
        
        // Auto-Follow
        if (settings.autoFollowEnabled) {
            const selectedAccounts = getSelectedAccounts(settings.autoFollowAccounts);
            if (selectedAccounts.length === 0) {
                details.push({ 
                    title: 'Auto-Follow Users', 
                    summary: 'Select at least one account.', 
                    type: 'warning', 
                    accounts: [], 
                    totalTime: 0 
                });
            } else if (settings.autoFollowTargetUsername.trim() === '') {  // ✅ FIXED
                details.push({ 
                    title: 'Auto-Follow Users', 
                    summary: 'Provide a target account username.', 
                    type: 'warning', 
                    accounts: selectedAccounts, 
                    totalTime: 0 
                });
            } else if (settings.autoFollowCount <= 0) {
                details.push({ 
                    title: 'Auto-Follow Users', 
                    summary: 'Number of follows must be greater than 0.', 
                    type: 'warning', 
                    accounts: selectedAccounts, 
                    totalTime: 0 
                });
            } else {
                // Tính thời gian:
                // - Nếu >= 3 bài: (60s × 3 bài) + (10s × 3) + 10s follow = 220s/user
                // - Nếu < 3 bài: 60s + 10s + 10s follow = 80s/user
                // → Trung bình: 220s/user
                const timePerUser = 75; // 60s view + 10s like + 5s follow
                const timePerAccount = timePerUser * settings.autoFollowCount;
                const totalTime = timePerAccount * selectedAccounts.length;

                grandTotal += totalTime;

                const target = settings.autoFollowTargetUsername.startsWith('@')   // ✅ FIXED
                    ? settings.autoFollowTargetUsername   // ✅ FIXED
                    : `@${settings.autoFollowTargetUsername}`;  // ✅ FIXED

                details.push({
                    title: 'Auto-Follow Users',
                    summary: `${settings.autoFollowCount} follows from ${target}'s ${settings.autoFollowSource}. Each user: view post (60s) + like (10s) + follow (5s).`,
                    totalTime: totalTime,
                    accounts: selectedAccounts,
                    type: 'info'
                });
            }
        }
    
        return { details, total: grandTotal };
    }, [settings, accounts]);

    const openAccountSelector = useCallback((activity: ModalConfig['activity'], title: string) => {
        setModalConfig({ activity, title });
        setIsAccountModalOpen(true);
    }, []);
    
    const handleSaveSelection = useCallback((selectedIds: number[]) => {
    if (!modalConfig) return;
    
    // ✅ ĐÚNG: Chỉ cập nhật activity được chọn
    if (modalConfig.activity === 'autoBrowse') {
        setSettings(prev => ({ 
            ...prev, 
            autoBrowseAccounts: selectedIds,
        }));
    } else if (modalConfig.activity === 'autoFollow') {
        setSettings(prev => ({ 
            ...prev, 
            autoFollowAccounts: selectedIds,
        }));
    }
    
        setIsAccountModalOpen(false);
        setModalConfig(null);
    }, [modalConfig]);

    const handleSaveSchedule = useCallback((scheduleData: { date: string, times: string[], repeat: boolean }) => {
    // ✅ Chỉ lưu settings của activities đang ENABLED
    const filteredSettings: CareSettings = {
        ...settings,
        // Nếu Browse không enabled, xóa accounts
        autoBrowseAccounts: settings.autoBrowseEnabled ? settings.autoBrowseAccounts : [],
        // Nếu Follow không enabled, xóa accounts  
        autoFollowAccounts: settings.autoFollowEnabled ? settings.autoFollowAccounts : [],
    };
    
    const newSchedule: CareActivitySchedule = {
        id: `care_${new Date().getTime()}`,
        settings: filteredSettings,
        schedule: scheduleData
    };

    try {
        const existingSchedulesRaw = localStorage.getItem('care-activity-schedules');
        const existingSchedules: CareActivitySchedule[] = existingSchedulesRaw ? JSON.parse(existingSchedulesRaw) : [];
        const updatedSchedules = [...existingSchedules, newSchedule];
        localStorage.setItem('care-activity-schedules', JSON.stringify(updatedSchedules));
        
        console.log('📝 Saved schedule:', newSchedule);  // ✅ Debug log
        
        // ✅ REMOVED: saveCareToHistory khi Schedule
        // Lý do: care-activity-schedules đã đủ để hiển thị trên Calendar
        // saveCareToHistory chỉ nên gọi khi Run Now hoặc khi schedule thực sự chạy
        // Việc gọi ở đây gây duplicate (1 từ schedules, 1 từ history)
        
        console.log('✅ Schedule saved to care-activity-schedules (no duplicate history)');
        
            } catch (error) {
                console.error("Could not save care schedule to localStorage", error);
            }
            
            setIsScheduleModalOpen(false);
        }, [settings, accounts]);

    return {
        settings,
        setSettings,
        isAccountModalOpen,
        setIsAccountModalOpen,
        isScheduleModalOpen,
        setIsScheduleModalOpen,
        modalConfig,
        overviewCalculations,
        openAccountSelector,
        handleSaveSelection,
        handleSaveSchedule,
    };
};