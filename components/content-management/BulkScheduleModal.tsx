import React, { useState, useEffect, useMemo, useRef } from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (settings: { startDate: string; postsPerDay: number; timeSlots: string[] }) => void;
  selectedCount: number;
}

const DatePickerPopup: React.FC<{
  onSelect: (date: string) => void;
  onClose: () => void;
  initialDate: string;
}> = ({ onSelect, onClose, initialDate }) => {
    const initial = initialDate ? new Date(initialDate + "T00:00:00") : new Date();
    const [displayDate, setDisplayDate] = useState(initial);
    const selectedDate = initial;

    const handleMonthChange = (offset: number) => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + offset, 1));
    };

    const handleDayClick = (day: number) => {
        const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
        onSelect(newDate.toISOString().split('T')[0]);
        onClose();
    };

    const calendarGrid = useMemo(() => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid: (number | null)[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push(i);
        }
        return grid;
    }, [displayDate]);

    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();

    return (
        <div className="absolute top-full mt-2 z-30 bg-content-dark border border-border-dark rounded-lg shadow-2xl p-4 text-white animate-in fade-in-0 zoom-in-95 w-max">
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
                                    className={`w-8 h-8 rounded-full text-sm transition-colors ${
                                        selectedDate?.getDate() === day && selectedDate?.getMonth() === displayDate.getMonth() && selectedDate?.getFullYear() === displayDate.getFullYear()
                                            ? 'bg-primary text-white font-bold'
                                            : day === today.getDate() && displayDate.getMonth() === today.getMonth() && displayDate.getFullYear() === today.getFullYear()
                                            ? 'text-primary'
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
        </div>
    );
};

const BulkScheduleModal: React.FC<BulkScheduleModalProps> = ({
  isOpen,
  onSchedule,
  onClose,
  selectedCount,
}) => {
  const [startDate, setStartDate] = useState('');
  const [postsPerDay, setPostsPerDay] = useState(1);
  const [timeSlots, setTimeSlots] = useState<string[]>(['09:00']);
  const [error, setError] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      setStartDate(today.toISOString().split('T')[0]);
      setPostsPerDay(1);
      setTimeSlots(['09:00']);
      setError('');
      setIsDatePickerOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const newTimeSlots = Array.from(
      { length: postsPerDay || 0 },
      (_, i) => timeSlots[i] || `${String(9 + i).padStart(2, '0')}:00`
    );
    setTimeSlots(newTimeSlots);
  }, [postsPerDay]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTimeSlotChange = (index: number, part: 'hour' | 'minute', value: string) => {
    const newTimeSlots = [...timeSlots];
    const [currentHour, currentMinute] = newTimeSlots[index].split(':');
    
    let sanitizedValue = value.replace(/[^0-9]/g, '');

    if (part === 'hour') {
        if (parseInt(sanitizedValue, 10) > 23) sanitizedValue = '23';
        if (sanitizedValue.length > 2) sanitizedValue = sanitizedValue.slice(0, 2);
        newTimeSlots[index] = `${sanitizedValue}:${currentMinute}`;
    } else { // minute
        if (parseInt(sanitizedValue, 10) > 59) sanitizedValue = '59';
        if (sanitizedValue.length > 2) sanitizedValue = sanitizedValue.slice(0, 2);
        newTimeSlots[index] = `${currentHour}:${sanitizedValue}`;
    }
    
    setTimeSlots(newTimeSlots);
    if (error) setError('');
  };

  const handleTimeBlur = (index: number, part: 'hour' | 'minute') => {
    const newTimeSlots = [...timeSlots];
    const [currentHour, currentMinute] = newTimeSlots[index].split(':');
     if (part === 'hour') {
        newTimeSlots[index] = `${currentHour.padStart(2, '0')}:${currentMinute}`;
    } else { // minute
        newTimeSlots[index] = `${currentHour}:${currentMinute.padStart(2, '0')}`;
    }
    setTimeSlots(newTimeSlots);
  };

  const handlePostsPerDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setPostsPerDay(!e.target.value ? 0 : (value > 0 && value <= 24 ? value : postsPerDay));
    if (error) setError('');
  };
  
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) { setError('Please select a start date.'); return; }
    if (!postsPerDay || postsPerDay <= 0 || postsPerDay > 24) { setError('Posts per day must be between 1 and 24.'); return; }
    if (timeSlots.some((t) => !t || t.includes('undefined') || t.split(':').length < 2 || t.split(':')[0] === '' || t.split(':')[1] === '')) { 
        setError('Please fill in all time slots completely.'); 
        return; 
    }

    const start = new Date(startDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) { setError('Start date cannot be in the past.'); return; }

    onSchedule({ startDate, postsPerDay, timeSlots });
    onClose();
  };

  if (!isOpen) return null;

  const totalDays = postsPerDay > 0 ? Math.ceil(selectedCount / postsPerDay) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl dark:bg-content-dark border border-border-dark flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 flex-shrink-0">
            <div className="flex items-center justify-between pb-4 border-b dark:border-border-dark">
                <h2 className="text-xl font-bold dark:text-white">Advanced Bulk Schedule</h2>
                <button onClick={onClose} className="p-2 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close modal">
                    <MaterialSymbol icon="close" />
                </button>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-4">
          <p className="text-sm dark:text-gray-300 text-center p-2 bg-gray-800 rounded-md flex-shrink-0">
            Scheduling <span className="font-bold text-white">{selectedCount}</span> posts over <span className="font-bold text-white">{totalDays}</span> day(s).
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block mb-2 text-sm font-medium dark:text-gray-300">Start Date</label>
              <div className="relative" ref={pickerRef}>
                <button type="button" id="start-date" onClick={() => setIsDatePickerOpen(prev => !prev)} className="w-full h-10 flex items-center justify-between px-3 rounded-lg border dark:border-gray-600 bg-gray-800 text-white text-sm focus:ring-2 focus:ring-primary">
                   <span>{formatDateForDisplay(startDate)}</span>
                   <MaterialSymbol icon="calendar_today" className="text-base" />
                </button>
                {isDatePickerOpen && (
                  <DatePickerPopup onSelect={(date) => setStartDate(date)} initialDate={startDate} onClose={() => setIsDatePickerOpen(false)} />
                )}
              </div>
            </div>
            <div>
              <label htmlFor="posts-per-day" className="block mb-2 text-sm font-medium dark:text-gray-300">Posts per Day</label>
              <input id="posts-per-day" type="number" value={postsPerDay > 0 ? postsPerDay : ''} onChange={handlePostsPerDayChange} min={1} max={24} className="w-full h-10 px-3 text-sm rounded-lg border dark:border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., 3" required />
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium dark:text-gray-300">Time Slots</label>
            <div className="space-y-3">
              {timeSlots.map((time, index) => {
                const [hour = '', minute = ''] = time.split(':');
                return (
                    <div key={index} className="flex items-center gap-4">
                         <span className="text-sm text-gray-400 w-8 text-right font-mono">{String(index + 1).padStart(2, '0')}.</span>
                         <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            <input
                                type="number"
                                value={hour}
                                onBlur={() => handleTimeBlur(index, 'hour')}
                                onChange={(e) => handleTimeSlotChange(index, 'hour', e.target.value)}
                                className="w-full h-10 px-2 text-center text-sm rounded-lg border dark:border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                aria-label={`Hour for time slot ${index + 1}`}
                            />
                            <span className="font-bold text-white">:</span>
                            <input
                                type="number"
                                value={minute}
                                onBlur={() => handleTimeBlur(index, 'minute')}
                                onChange={(e) => handleTimeSlotChange(index, 'minute', e.target.value)}
                                className="w-full h-10 px-2 text-center text-sm rounded-lg border dark:border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                aria-label={`Minute for time slot ${index + 1}`}
                            />
                        </div>
                    </div>
                );
              })}
            </div>
          </div>

          {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
          
          <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-content-dark py-4 -mx-6 px-6 border-t border-border-dark">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-100 border border-gray-300 rounded-lg dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
            <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg btn-instagram"><span>Schedule</span></button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkScheduleModal;