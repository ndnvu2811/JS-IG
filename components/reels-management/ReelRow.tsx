import React, { useState, useRef, useEffect } from 'react';
import { Reel, ReelStatus } from '../../types';
import AutoResizeTextarea from '../content-management/AutoResizeTextarea';
import VideoInput from './VideoInput';
import DateTimePicker from '../content-management/DateTimePicker';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ReelRowProps {
    reel: Reel;
    index: number;
    isSelected: boolean;
    onSelect: (reelId: number) => void;
    onContentChange: (reelId: number, content: string) => void;
    onVideoChange: (reelId: number, video: { url: string }) => void;
    onPostNow: (reelId: number) => void;
    onScheduleChange: (reelId: number, dateTime: string) => void;
    onShareToThreadsChange: (reelId: number, value: boolean) => void;
    onDeleteReel: (reelId: number) => void;
    onAspectRatioChange: (reelId: number, ratio: string) => void;
    onSaveVideo?: (reelId: number) => void;
    onRowNumberChange?: (reelId: number, rowNumber: number) => void;
    onImportFromMediaLibrary?: (reelId: number) => void;
}

const ReelRow: React.FC<ReelRowProps> = ({ 
    reel, 
    index, 
    isSelected, 
    onSelect, 
    onContentChange,
    onVideoChange,
    onPostNow, 
    onScheduleChange,
    onShareToThreadsChange,
    onAspectRatioChange,
    onSaveVideo,
    onRowNumberChange,
    onImportFromMediaLibrary
}) => {
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formatDateForDisplay = (dateString?: string) => {
        if (!dateString) return 'Schedule...';
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return 'Schedule...';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch (e) {
            return 'Schedule...';
        }
    };

    const handleDateTimeChange = (date: Date | null) => {
        if (date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
            onScheduleChange(reel.id, dateTimeString);
        } else {
            onScheduleChange(reel.id, '');
        }
        setIsPickerOpen(false);
    }

    // ✅ Hàm mở link bằng trình duyệt mặc định (Chrome window nhỏ)
    const handleOpenReelUrl = (url: string) => {
        if ((window as any).electronAPI?.openExternalLink) {
            (window as any).electronAPI.openExternalLink(url);
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <tr className="bg-white dark:bg-content-dark border-b dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50">
            {/* Checkbox */}
            <td className="w-4 p-4 align-middle">
                <div className="flex items-center">
                    <input
                        id={`checkbox-table-${reel.id}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(reel.id)}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                    <label htmlFor={`checkbox-table-${reel.id}`} className="sr-only">checkbox</label>
                </div>
            </td>

            {/* Index */}
            <td className="px-4 py-4 text-center align-middle">
                <input
                    type="number"
                    value={reel.rowNumber ?? index}
                    onChange={(e) => {
                        const newNumber = parseInt(e.target.value) || index;
                        onRowNumberChange?.(reel.id, newNumber);
                    }}
                    className="w-12 bg-transparent border border-gray-600 rounded px-1 py-1 text-center text-gray-500 dark:text-gray-400 font-medium focus:border-purple-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
            </td>

            {/* Caption */}
            <td className="px-4 py-4 align-top custom-scrollbar">
                <AutoResizeTextarea
                    value={reel.content}
                    onChange={(e) => onContentChange(reel.id, e.target.value)}
                    placeholder="Write your reel caption here..."
                    maxHeight={200}
                />
            </td>

            {/* Video */}
            <td className="px-4 py-4 align-middle">
                <div className="flex flex-col items-center gap-2">
                    <VideoInput 
                        video={reel.video} 
                        onChange={(video) => onVideoChange(reel.id, video)}
                        processingStatus={reel.processingStatus}
                        processingProgress={reel.processingProgress}
                    />
                    
                    {/* Aspect Ratio Dropdown - Chỉ hiện khi có video */}
                    {reel.video.url && (
                        <>
                            <select
                                value={reel.aspectRatio || '9:16'}
                                onChange={(e) => onAspectRatioChange(reel.id, e.target.value)}
                                className="w-full h-8 px-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-primary cursor-pointer"
                            >
                                <option value="9:16">9:16 (Vertical)</option>
                                <option value="1:1">1:1 (Square)</option>
                                <option value="16:9">16:9 (Horizontal)</option>
                                <option value="Original">Original (Auto)</option>
                            </select>
                        </>
                    )}
                </div>
            </td>

            {/* Task (Schedule + Post Now + Share Threads) */}
            <td className="px-4 py-4 align-middle">
                <div className="flex flex-col items-center gap-2">

                    {/* Import from Media Library Button */}
                    <button
                        onClick={() => onImportFromMediaLibrary?.(reel.id)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30 hover:text-blue-200 transition"
                        title="Import videos from Media Library"
                    >
                        <MaterialSymbol icon="collections" className="text-sm" />
                        Import
                    </button>

                    {/* Schedule Button */}
                    <div className="relative w-full" ref={pickerRef}>
                        <button
                            onClick={() => setIsPickerOpen(prev => !prev)}
                            className="w-full h-10 flex items-center justify-between px-3 rounded-lg border dark:border-gray-600 dark:bg-gray-800 hover:bg-gray-700 cursor-pointer text-left"
                            aria-label="Schedule Date and Time"
                        >
                            <span className={`text-xs ${reel.scheduledTime ? 'text-white' : 'text-gray-400'}`}>
                                {formatDateForDisplay(reel.scheduledTime)}
                            </span>
                            <MaterialSymbol icon="calendar_today" className="text-base text-white" />
                        </button>

                        {isPickerOpen && (
                            <DateTimePicker
                                value={reel.scheduledTime ? new Date(reel.scheduledTime) : null}
                                onChange={handleDateTimeChange}
                            />
                        )}
                    </div>

                    {/* Post Now Button */}
                    <button
                        onClick={() => onPostNow(reel.id)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg btn-instagram px-3 py-2 text-sm font-bold">
                        <span>Post Now</span>
                    </button>
                </div>
            </td>

            {/* Status */}
            <td className="px-4 py-4 align-middle">
                <div className="flex flex-col h-full items-center justify-center gap-1">
                    {reel.status === ReelStatus.Scheduled && reel.scheduledTime ? (
                        <div className="text-center p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-700 min-w-[120px]">
                            <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Scheduled</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">{formatDateForDisplay(reel.scheduledTime)}</p>
                        </div>
                        ) : reel.status === ReelStatus.Missed && reel.scheduledTime ? (
                        <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 min-w-[120px]">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">Missed</p>
                            <p className="text-xs text-red-600 dark:text-red-500">{formatDateForDisplay(reel.scheduledTime)}</p>
                        </div>
                    ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            reel.status === ReelStatus.Posted ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                            reel.status === ReelStatus.Posting ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                            reel.status === ReelStatus.Failed ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                            reel.status === ReelStatus.Missed ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                            reel.status === ReelStatus.Scheduled ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                            {reel.status}
                        </span>
                    )}
                    {/* Loading indicator for Posting status */}
                    {reel.status === ReelStatus.Posting && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            <MaterialSymbol icon="progress_activity" className="text-sm animate-spin" />
                            <span>Posting...</span>
                        </div>
                    )}
                    {/* ✅ FIX: Mở link bằng Chrome window nhỏ */}
                    {reel.status === ReelStatus.Posted && reel.postedUrl && (
                        <button
                            onClick={() => handleOpenReelUrl(reel.postedUrl!)}
                            className="text-xs text-blue-500 hover:underline mt-1 cursor-pointer bg-transparent border-none p-0"
                        >
                            View Reel
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default ReelRow;