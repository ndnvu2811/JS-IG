import React from 'react';
import { PostHistory, ReelHistory, CareHistory, InstagramAccount } from '../../types';

interface CalendarGridProps {
    calendarGrid: { key: string; day: number | null }[];
    postsByDay: Map<number, PostHistory[]>;
    reelsByDay: Map<number, ReelHistory[]>;
    careByDay: Map<number, CareHistory[]>;
    isToday: (day: number | null) => boolean;
    onDeleteItem: (itemId: string, itemType: 'post' | 'reel' | 'care') => void; // giữ để ScheduleCalendar truyền vào, nhưng không dùng ở đây
    onDayClick: (day: number) => void;
    selectedAccount: InstagramAccount | null;
}

interface AccountSummary {
    account: string;
    carePlan: number;
    scheduledPost: number;
    posted: number;
    scheduledReel: number;
    missed: number; // ✅ Thêm field missed
}

interface AccountSummaryRowProps {
    summary: AccountSummary;
}

const AccountSummaryRow: React.FC<AccountSummaryRowProps> = ({ summary }) => {
    // Tạo list icon theo đúng thứ tự màu
    const items = [
        { value: summary.carePlan, color: 'blue', label: 'Care' },
        { value: summary.scheduledPost, color: 'purple', label: 'Scheduled' },
        { value: summary.posted, color: 'green', label: 'Posted' },
        { value: summary.scheduledReel, color: 'orange', label: 'Reel' },
        { value: summary.missed, color: 'red', label: 'Missed' }, // ✅ Thêm Missed
    ].filter(item => item.value > 0); // <-- ẩn nút nếu value = 0

    return (
        <div className="grid grid-cols-2 gap-2 mt-3">
            {items.map((item, idx) => (
                <div
                    key={idx}
                    className={`
                        w-7 h-7 rounded-full flex items-center justify-center
                        border 
                        ${item.color === 'blue' ? 'border-blue-500 text-blue-400' : ''}
                        ${item.color === 'purple' ? 'border-purple-500 text-purple-400' : ''}
                        ${item.color === 'green' ? 'border-green-500 text-green-400' : ''}
                        ${item.color === 'orange' ? 'border-orange-500 text-orange-400' : ''}
                        ${item.color === 'red' ? 'border-red-500 text-red-400' : ''}
                    `}
                >
                    <span className="text-[11px] font-semibold">
                        {item.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

const CalendarGrid: React.FC<CalendarGridProps> = ({
    calendarGrid,
    postsByDay,
    reelsByDay,
    careByDay,
    isToday,
    onDeleteItem, // không dùng nhưng giữ để không lỗi props
    onDayClick,
}) => {
    // Tạo summary cho từng ngày
    const getSummariesForDay = (day: number | null): AccountSummary[] => {
    if (!day) return [];

    const accountMap = new Map<string, AccountSummary>();

    const ensureAccount = (account: string) => {
        if (!accountMap.has(account)) {
            accountMap.set(account, {
                account,
                carePlan: 0,
                scheduledPost: 0,
                posted: 0,
                scheduledReel: 0,
                missed: 0, // ✅ Thêm missed
            });
        }
        return accountMap.get(account)!;
    };

    // Posts
    const dailyPosts = postsByDay.get(day) || [];
    dailyPosts.forEach((post) => {
        const s = ensureAccount(post.account);
        if (post.status === 'Posted') {
            s.posted += 1;
        } else if (post.status === 'Missed') {
            s.missed += 1; // ✅ Đếm Missed posts
        } else {
            s.scheduledPost += 1;
        }
    });

    // Reels
    const dailyReels = reelsByDay.get(day) || [];
    dailyReels.forEach((reel) => {
        const s = ensureAccount(reel.account);
        if (reel.status === 'Posted') {
            s.posted += 1;
        } else if (reel.status === 'Missed') {
            s.missed += 1; // ✅ Đếm Missed reels
        } else {
            s.scheduledReel += 1;
        }
    });

    // Care Activities
    const dailyCare = careByDay.get(day) || [];

    dailyCare.forEach((care) => {
        care.accounts.forEach((account) => {
            const s = ensureAccount(account);
            
            if (care.status === 'Completed') {
                s.posted += 1;
            } else if (care.status === 'Missed') {
                s.missed += 1; // ✅ Đếm Missed care
            } else if (!care.status || care.status === 'Scheduled') {
                s.carePlan += 1;
            }
        });
    });

    const summaries = Array.from(accountMap.values());

    if (summaries.length > 1) {
        return [{
            account: 'Total',
            carePlan: summaries.reduce((sum, s) => sum + s.carePlan, 0),
            scheduledPost: summaries.reduce((sum, s) => sum + s.scheduledPost, 0),
            posted: summaries.reduce((sum, s) => sum + s.posted, 0),
            scheduledReel: summaries.reduce((sum, s) => sum + s.scheduledReel, 0),
            missed: summaries.reduce((sum, s) => sum + s.missed, 0), // ✅ Tổng missed
        }];
    }

        return summaries;
    };

    return (
        <div className="flex-1 flex flex-col bg-content-dark rounded-lg border border-border-dark overflow-hidden min-h-0">
            {/* Header - Days of week */}
            <div className="grid grid-cols-7 gap-px border-b border-border-dark">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                    <div
                        key={day}
                        className="text-center font-bold py-2 text-gray-400 text-sm"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid - Calendar cells */}
            <div className="flex-1 overflow-y-auto table-scrollbar">
                <div className="grid grid-cols-7 gap-px bg-border-dark">
                    {calendarGrid.map(({ key, day }) => {
                        const summaries = getSummariesForDay(day);
                        const hasActivities = summaries.length > 0;

                        return (
                            <div
                                key={key}
                                className={`bg-content-dark p-2 relative flex flex-col min-h-[8rem] ${
                                    hasActivities
                                        ? 'cursor-pointer hover:bg-gray-800/50 transition-colors'
                                        : ''
                                }`}
                                onClick={() => day && onDayClick(day)}
                            >
                                {/* Số ngày */}
                                {day && (
                                    <span
                                        className={`absolute top-2 right-2 text-sm font-bold ${
                                            isToday(day)
                                                ? 'text-instagram-purple ring-2 ring-instagram-purple rounded-full w-7 h-7 flex items-center justify-center'
                                                : 'text-gray-400'
                                        }`}
                                    >
                                        {day}
                                    </span>
                                )}

                                {/* Account summaries: @account + 🔵 🟣 🟢 🟠 */}
                                {summaries.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-8 items-center">
                                        {summaries.map((summary, idx) => (
                                            <AccountSummaryRow
                                                key={`${summary.account}-${idx}`}
                                                summary={summary}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarGrid;