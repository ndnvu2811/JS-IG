import React, { useMemo, useState, useEffect } from 'react';
import { InstagramAccount, View } from '../types';
import { useApp } from '../hooks/useApp';
import { useScheduleCalendar } from '../hooks/useScheduleCalendar';
import CalendarHeader from '../components/schedule-calendar/CalendarHeader';
import CalendarGrid from '../components/schedule-calendar/CalendarGrid';
import MaterialSymbol from '../components/icons/MaterialSymbol';
import DayDetailModal from '../components/schedule-calendar/DayDetailModal';
import { getActivitiesForDate, deleteCareSchedule } from '../utils/historyUtils';

interface ScheduleCalendarProps {
    setCurrentView: (view: View) => void;
    selectedAccount: InstagramAccount | null;
    onAccountChange: (account: InstagramAccount | null) => void;
    accounts: InstagramAccount[];
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
    setCurrentView,
    selectedAccount,
    onAccountChange,
    accounts,
}) => {
    const {
        currentDate,
        postsByDay,
        reelsByDay,
        careByDay,
        calendarGrid,
        getMonthName,
        handlePrevMonth,
        handleNextMonth,
        isToday,
        handleDeleteItem,
    } = useScheduleCalendar(selectedAccount);

    // ============================
    // ✅ Thêm các state mới
    // ============================
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);

    // ✅ CHỈ CHẠY 1 LẦN DUY NHẤT
    useEffect(() => {
        if (!hasInitialized) {
            onAccountChange(null);
            setHasInitialized(true);
        }
    }, [hasInitialized, onAccountChange]);

    // ============================
    // ✅ Handler: click vào một ngày
    // ============================
    const handleDayClick = (day: number) => {
        const clickedDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
        );
        setSelectedDay(clickedDate);
        setIsDetailModalOpen(true);
    };

    // ============================
    // ✅ Handler: đóng modal
    // ============================
    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedDay(null);
    };

    // ============================
    // ✅ Lấy dữ liệu activity cho ngày đã chọn
    // ============================
    const dayActivities = useMemo(() => {
        if (!selectedDay) return { posts: [], reels: [], care: [] };
        return getActivitiesForDate(selectedDay, selectedAccount?.username);
    }, [selectedDay, selectedAccount]);

    const renderHeader = () => (
        <CalendarHeader
            setCurrentView={setCurrentView}
            selectedAccount={selectedAccount}
            onAccountChange={onAccountChange}
            accounts={accounts}
            currentDate={currentDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            getMonthName={getMonthName}
        />
    );

    if (accounts.length === 0) {
        return (
            <div className="flex flex-col h-full">
                {renderHeader()}
                <div className="flex flex-col flex-1 items-center justify-center h-full text-center bg-content-dark rounded-lg border border-border-dark">
                    <MaterialSymbol
                        icon="group_add"
                        className="text-6xl text-gray-400 dark:text-gray-500 mb-4"
                    />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        No Accounts Found
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        Please add an Instagram account to view the calendar.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {renderHeader()}
            <CalendarGrid
                calendarGrid={calendarGrid}
                postsByDay={postsByDay}
                reelsByDay={reelsByDay}
                careByDay={careByDay}
                isToday={isToday}
                onDeleteItem={handleDeleteItem}
                onDayClick={handleDayClick}
                selectedAccount={selectedAccount}
            />

            {/* Day Detail Modal */}
            <DayDetailModal
                isOpen={isDetailModalOpen}
                date={selectedDay}
                posts={dayActivities.posts}
                reels={dayActivities.reels}
                care={dayActivities.care}
                onClose={handleCloseDetailModal}
                onDeletePost={(id) => {
                    handleDeleteItem(id, 'post');
                    // ✅ Reload data without closing modal
                    if (selectedDay) {
                        const newDate = new Date(selectedDay.getTime());
                        setSelectedDay(newDate);
                    }
                }}
                onDeleteReel={(id) => {
                    handleDeleteItem(id, 'reel');
                    // ✅ Reload data without closing modal
                    if (selectedDay) {
                        const newDate = new Date(selectedDay.getTime());
                        setSelectedDay(newDate);
                    }
                }}
                onDeleteCare={(id) => {
                    console.log('🗑️ Deleting care item:', id);
                    
                    // ✅ FIX: Xử lý cả CareHistory và CareSchedule
                    if (id.startsWith('care_history_')) {
                        // Xóa từ care-history (Run Now items)
                        const historyRaw = localStorage.getItem('care-history');
                        if (historyRaw) {
                            const history = JSON.parse(historyRaw);
                            const filtered = history.filter((h: any) => h.id !== id);
                            localStorage.setItem('care-history', JSON.stringify(filtered));
                            console.log('✅ Deleted from care-history');
                        }
                    } else {
                        // Xóa từ care-activity-schedules (Scheduled items)
                        deleteCareSchedule(id);
                        console.log('✅ Deleted from care-activity-schedules');
                        
                        // ✅ THÊM: Xóa cả history items liên quan đến schedule này
                        const historyRaw = localStorage.getItem('care-history');
                        if (historyRaw) {
                            const history = JSON.parse(historyRaw);
                            const filtered = history.filter((h: any) => h.originalScheduleId !== id);
                            localStorage.setItem('care-history', JSON.stringify(filtered));
                            console.log('✅ Also deleted related history items');
                        }
                    }
                    
                    window.dispatchEvent(new CustomEvent('storage-change'));
                    console.log('✅ Deleted and dispatched event');
                    
                    // ✅ Reload data without closing modal
                    if (selectedDay) {
                        const newDate = new Date(selectedDay.getTime());
                        setSelectedDay(newDate);
                    }
                }}
            />
        </div>
    );
};

export default ScheduleCalendar;