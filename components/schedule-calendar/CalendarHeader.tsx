import React, { useState, useEffect, useRef } from 'react';
import { View, InstagramAccount } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';

interface CalendarHeaderProps {
    setCurrentView: (view: View) => void;
    selectedAccount: InstagramAccount | null;
    onAccountChange: (account: InstagramAccount | null) => void;
    accounts: InstagramAccount[];
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    getMonthName: (date: Date) => string;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    setCurrentView,
    selectedAccount,
    onAccountChange,
    accounts,
    currentDate,
    onPrevMonth,
    onNextMonth,
    getMonthName,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // CLOSE DROPDOWN when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <header className="flex flex-col gap-4 mb-6">
            {/* LEFT SIDE: Title + Description */}
            <div>
                <h1 className="text-gray-900 dark:text-white text-3xl font-bold">
                    Calendar
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-base">
                    View and manage your scheduled posts.
                </p>
            </div>

            {/* RIGHT SIDE: Legend (always top row) */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                    <span>Care Plan</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                    <span>Scheduled Post</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span>Posted</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                    <span>Scheduled Reel</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span>Missed</span>
                </div>
            </div>

            {/* SECOND ROW: Dropdown + Month Nav + Schedule Button */}
            <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end ">

                {/* ACCOUNT DROPDOWN */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-content-dark border border-border-dark rounded-lg hover:bg-gray-700 transition-colors "
                        onClick={() => setIsDropdownOpen(prev => !prev)}
                    >
                        {selectedAccount ? (
                            <>
                                <img
                                    src={selectedAccount.avatarUrl}
                                    alt={selectedAccount.username}
                                    className="w-6 h-6 rounded-full"
                                />
                                <span className="font-medium">@{selectedAccount.username}</span>
                            </>
                        ) : (
                            <>
                                <MaterialSymbol icon="group" className="text-lg" />
                                <span className="font-medium">All Accounts</span>
                            </>
                        )}
                        <MaterialSymbol icon="expand_more" className="text-lg" />
                    </button>

                    {/* DROPDOWN MENU */}
                    <div
                        className={`${isDropdownOpen ? 'block' : 'hidden'} absolute top-full left-0 mt-2 w-64 bg-content-dark border border-border-dark rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto table-scrollbar`}
                    >
                        {/* ALL ACCOUNTS */}
                        <button
                            onClick={() => {
                                onAccountChange(null);
                                setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                                !selectedAccount ? 'bg-gray-700' : ''
                            }`}
                        >
                            <MaterialSymbol icon="group" className="text-lg" />
                            <div className="flex-1 text-left">
                                <p className="font-medium">All Accounts</p>
                                <p className="text-xs text-gray-400">View all activities</p>
                            </div>
                            {!selectedAccount && (
                                <MaterialSymbol icon="check" className="text-instagram-purple" />
                            )}
                        </button>

                        <div className="border-t border-border-dark"></div>

                        {/* INDIVIDUAL ACCOUNTS */}
                        {accounts.map(account => (
                            <button
                                key={account.id}
                                onClick={() => {
                                    onAccountChange(account);
                                    setIsDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                                    selectedAccount?.id === account.id ? 'bg-gray-700' : ''
                                }`}
                            >
                                <img
                                    src={account.avatarUrl}
                                    alt={account.username}
                                    className="w-8 h-8 rounded-full"
                                />
                                <div className="flex-1 text-left">
                                    <p className="font-medium">@{account.username}</p>
                                    <p className="text-xs text-gray-400">{account.category}</p>
                                </div>
                                {selectedAccount?.id === account.id && (
                                    <MaterialSymbol icon="check" className="text-instagram-purple" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MONTH NAVIGATION */}
                <div className="flex items-center bg-content-dark p-1 rounded-lg">
                    <button
                        onClick={onPrevMonth}
                        className="p-2 rounded-md hover:bg-gray-700"
                    >
                        <MaterialSymbol icon="chevron_left" />
                    </button>

                    <span className="font-bold w-40 text-center">
                        {getMonthName(currentDate)}
                    </span>

                    <button
                        onClick={onNextMonth}
                        className="p-2 rounded-md hover:bg-gray-700"
                    >
                        <MaterialSymbol icon="chevron_right" />
                    </button>
                </div>

                {/* SCHEDULE POST BUTTON */}
                <button
                    onClick={() => setCurrentView(View.Content)}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg btn-instagram px-4 text-sm font-bold"
                >
                    <MaterialSymbol icon="add" className="text-base" />
                    <span>Schedule Post</span>
                </button>
            </div>
        </header>
    );
};

export default CalendarHeader;
