
import React, { useState, useEffect, useMemo } from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface DateTimePickerProps {
    value: Date | null;
    onChange: (date: Date | null) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange }) => {
    const initialDate = value || new Date();
    const [displayDate, setDisplayDate] = useState(initialDate);
    const [selectedDate, setSelectedDate] = useState<Date | null>(value || new Date());
    const [hour, setHour] = useState(() => String(initialDate.getHours()).padStart(2, '0'));
    const [minute, setMinute] = useState(() => String(initialDate.getMinutes()).padStart(2, '0'));
    const [error, setError] = useState('');

    useEffect(() => {
        if (value) {
            setDisplayDate(value);
            setSelectedDate(value);
            setHour(String(value.getHours()).padStart(2, '0'));
            setMinute(String(value.getMinutes()).padStart(2, '0'));
            setError('');
        }
    }, [value]);

    const handleMonthChange = (offset: number) => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + offset, 1));
    };

    const handleDayClick = (day: number) => {
        const newSelectedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
        setSelectedDate(newSelectedDate);
        setError('');
    };

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 0 && value <= 23) {
        setHour(String(value).padStart(2, '0'));
        setError('');
    } else if (e.target.value === '') {
        setHour('00');
        }
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 0 && value <= 59) {
        setMinute(String(value).padStart(2, '0'));
        setError('');
    } else if (e.target.value === '') {
        setMinute('00');
        }
    };

    const handleApply = () => {
        if (selectedDate) {
            const finalDate = new Date(selectedDate);
            finalDate.setHours(parseInt(hour, 10) || 0);
            finalDate.setMinutes(parseInt(minute, 10) || 0);
            finalDate.setSeconds(0, 0);

            const now = new Date();
            now.setSeconds(0, 0);

            if (finalDate < now) {
                setError("Cannot schedule in the past.");
                return;
            }

            setError('');
            onChange(finalDate);
        }
    };

    const handleClear = () => {
        setError('');
        onChange(null);
    };

    const handleSetToday = () => {
        const today = new Date();
        setSelectedDate(today);
        setDisplayDate(today);
        setHour(String(today.getHours()).padStart(2, '0'));
        setMinute(String(today.getMinutes()).padStart(2, '0'));
        setError('');
    }

    const calendarGrid = useMemo(() => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push(i);
        }
        return grid;
    }, [displayDate]);

    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={(e) => { if (e.target === e.currentTarget) onChange(null); }}>
    <div className="bg-content-dark border border-border-dark rounded-lg shadow-2xl p-4 text-white animate-in fade-in-0 zoom-in-95 w-max" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-4">
                {/* Left Column: Calendar */}
                <div className="w-64">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => handleMonthChange(-1)} className="p-1 rounded-full hover:bg-gray-700"><MaterialSymbol icon="chevron_left" /></button>
                        <div className="font-bold text-sm">
                            {displayDate.toLocaleString('default', { month: 'long' })} {displayDate.getFullYear()}
                        </div>
                        <button onClick={() => handleMonthChange(1)} className="p-1 rounded-full hover:bg-gray-700"><MaterialSymbol icon="chevron_right" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                        {dayNames.map((day, i) => <div key={i}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarGrid.map((day, i) => (
                            <div key={i} className="flex justify-center items-center h-8">
                                {day && (
                                    <button
                                        onClick={() => handleDayClick(day)}
                                        className={`w-8 h-8 rounded-full text-sm transition-colors ${selectedDate?.getDate() === day && selectedDate?.getMonth() === displayDate.getMonth() && selectedDate?.getFullYear() === displayDate.getFullYear()
                                                ? 'bg-purple-600 text-white font-bold'
                                                : 'hover:bg-gray-700'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Time and Actions */}
                <div className="flex flex-col pl-4 border-l border-border-dark w-48">
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-center text-sm font-bold mb-2 text-gray-300">Time</div>
                        <div className="flex items-center justify-center gap-2">
                            <input type="number" min="0" max="23" value={hour} onChange={handleHourChange} className="w-16 p-2 text-center bg-gray-800 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500" aria-label="Hour" />
                            <span className="font-bold">:</span>
                            <input type="number" min="0" max="59" value={minute} onChange={handleMinuteChange} className="w-16 p-2 text-center bg-gray-800 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500" aria-label="Minute" />
                        </div>
                        <div className="flex justify-center gap-2 text-xs text-gray-400 mt-1 w-full">
                            <span className="w-16 text-center">Hour</span>
                            <span className="w-16 text-center">Minute</span>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-xs text-center -mt-2 mb-2">{error}</p>}

                    <div className="flex items-center justify-between border-t border-border-dark pt-3">
                        <button onClick={handleClear} className="text-sm font-medium text-gray-400 hover:text-white">Clear</button>
                        <div className="flex items-center gap-2">
                            <button onClick={handleSetToday} className="px-3 py-1.5 text-sm font-medium bg-gray-700 rounded-md hover:bg-gray-600">Today</button>
                            <button onClick={handleApply} className="px-3 py-1.5 text-sm font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700">Apply</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

export default DateTimePicker;