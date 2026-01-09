import React, { useState, useEffect, useRef } from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ScheduleSettings {
    date: string;
    times: string[];
    repeat: boolean;
}

interface CareScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: ScheduleSettings) => void;
}

const DirectTimeInput: React.FC<{
    value: string; // HH:mm (24h format)
    onChange: (value: string) => void;
}> = ({ value, onChange }) => {
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');

    useEffect(() => {
        const [h, m] = value.split(':');
        setHour(h || '00');
        setMinute(m || '00');
    }, [value]);

    const updateTime = (newHour: string, newMinute: string) => {
        const h = newHour.padStart(2, '0');
        const m = newMinute.padStart(2, '0');
        onChange(`${h}:${m}`);
    };

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        
        if (val !== '') {
            let num = parseInt(val, 10);
            if (num > 23) num = 23;
            if (num < 0) num = 0;
            val = String(num);
        }
        
        setHour(val);
    };

    const handleHourBlur = () => {
        let val = hour;
        if (val === '') val = '00';
        val = val.padStart(2, '0');
        setHour(val);
        updateTime(val, minute);
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        
        if (val !== '') {
            let num = parseInt(val, 10);
            if (num > 59) num = 59;
            if (num < 0) num = 0;
            val = String(num);
        }
        
        setMinute(val);
    };

    const handleMinuteBlur = () => {
        let val = minute;
        if (val === '') val = '00';
        val = val.padStart(2, '0');
        setMinute(val);
        updateTime(hour, val);
    };

    const inputClasses = "w-16 h-10 text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-medium focus:ring-2 focus:ring-instagram-purple focus:border-transparent outline-none transition-all placeholder-gray-400";

    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <input
                    type="text"
                    inputMode="numeric"
                    value={hour}
                    onChange={handleHourChange}
                    onBlur={handleHourBlur}
                    maxLength={2}
                    className={inputClasses}
                    placeholder="HH"
                />
            </div>
            <span className="text-gray-500 dark:text-gray-400 font-bold text-xl pb-1">:</span>
            <div className="relative">
                <input
                    type="text"
                    inputMode="numeric"
                    value={minute}
                    onChange={handleMinuteChange}
                    onBlur={handleMinuteBlur}
                    maxLength={2}
                    className={inputClasses}
                    placeholder="MM"
                />
            </div>
        </div>
    );
};


const CareScheduleModal: React.FC<CareScheduleModalProps> = ({ isOpen, onClose, onSave }) => {
    const [date, setDate] = useState('');
    const [times, setTimes] = useState<string[]>(['09:00']);
    const [repeat, setRepeat] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            setDate(`${year}-${month}-${day}`);
            
            // Set default time to current time
            const currentHour = String(today.getHours()).padStart(2, '0');
            const currentMinute = String(today.getMinutes()).padStart(2, '0');
            setTimes([`${currentHour}:${currentMinute}`]);
            
            setRepeat(false);
        }
    }, [isOpen]);

    const handleAddTime = () => {
        // Add current time + 1 hour
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const newHour = String(now.getHours()).padStart(2, '0');
        const newMinute = String(now.getMinutes()).padStart(2, '0');
        setTimes([...times, `${newHour}:${newMinute}`]);
    };

    const handleRemoveTime = (indexToRemove: number) => {
        setTimes(times.filter((_, index) => index !== indexToRemove));
    };

    const handleTimeChange = (indexToChange: number, value: string) => {
        setTimes(times.map((time, index) => (index === indexToChange ? value : time)));
    };
    
    const handleSave = () => {
        onSave({ date, times, repeat });
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="relative w-full max-w-md p-6 m-4 bg-white rounded-xl shadow-2xl dark:bg-content-dark border border-gray-200 dark:border-border-dark animate-in fade-in-0 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-border-dark">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Schedule Activities</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Close modal">
                        <MaterialSymbol icon="close" />
                    </button>
                </div>

                <div className="mt-6 space-y-6">
                    {!repeat && (
                        <div>
                            <label htmlFor="schedule-date" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Date
                            </label>
                            <div className="relative">
                                <input
                                    id="schedule-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-instagram-purple focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Time Slots
                            </label>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                                {times.length} slot{times.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                       
                        <div className="space-y-3 max-h-[240px] overflow-y-auto table-scrollbar pr-2 -mr-2">
                            {times.map((time, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                                     <div className="flex-1">
                                        <DirectTimeInput 
                                            value={time} 
                                            onChange={(newTime) => handleTimeChange(index, newTime)} 
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTime(index)}
                                        className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        disabled={times.length <= 1}
                                        aria-label={`Remove time slot ${index + 1}`}
                                    >
                                        <MaterialSymbol icon="remove_circle" className="text-xl" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={handleAddTime}
                            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <MaterialSymbol icon="add" />
                            Add Time Slot
                        </button>
                    </div>

                    <div className="flex items-center pt-2">
                        <div className="relative flex items-center">
                            <input
                                id="repeat-daily"
                                type="checkbox"
                                checked={repeat}
                                onChange={(e) => setRepeat(e.target.checked)}
                                className="w-5 h-5 text-instagram-purple bg-gray-100 border-gray-300 rounded focus:ring-instagram-purple dark:focus:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                            />
                        </div>
                        <label htmlFor="repeat-daily" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                            Repeat this schedule daily
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-border-dark">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg btn-instagram shadow-lg shadow-instagram-purple/20"
                    >
                        <span>Save Schedule</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CareScheduleModal;