import React, { useState, useRef, useEffect } from 'react';
import { Post, PostStatus } from '../../types';
import AutoResizeTextarea from './AutoResizeTextarea';
import MediaInput from './MediaInput';
import DateTimePicker from './DateTimePicker';
import MaterialSymbol from '../icons/MaterialSymbol';

interface PostRowProps {
    post: Post;
    index: number;
    isSelected: boolean;
    onSelect: (postId: number) => void;
    onContentChange: (postId: number, content: string) => void;
    onTypeChange: (postId: number, type: 'Post' | 'Reel') => void;
    onPostNow: (postId: number) => void;
    onRowNumberChange?: (postId: number, rowNumber: number) => void;
    onScheduleChange: (postId: number, dateTime: string) => void;
    onMediaChange: (postId: number, media: { type: 'image' | 'video'; url: string }[]) => void;
    onShareToThreadsChange: (postId: number, value: boolean) => void;
    onSaveMedia?: (postId: number) => void;
    onQuickFix?: (postId: number) => void;
    onMediaRemove?: (postId: number, newMedia: { type: 'image' | 'video'; url: string }[]) => void;
    onImportFromMediaLibrary?: (postId: number) => void;
}

const PostRow: React.FC<PostRowProps> = ({ 
    post, 
    index, 
    isSelected, 
    onSelect, 
    onContentChange, 
    onTypeChange, 
    onPostNow, 
    onScheduleChange,
    onMediaChange,
    onShareToThreadsChange,
    onSaveMedia,
    onRowNumberChange,
    onQuickFix,
    onMediaRemove,
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
            onScheduleChange(post.id, dateTimeString);
        } else {
            onScheduleChange(post.id, '');
        }
        setIsPickerOpen(false);
    }

    // ✅ Hàm mở link bằng trình duyệt mặc định
    const handleOpenPostUrl = (url: string) => {
        // Trong Electron, cần gửi IPC để main process mở bằng shell
        if ((window as any).electronAPI?.openExternalLink) {
            (window as any).electronAPI.openExternalLink(url);
        } else {
            // Fallback: mở trong tab mới (hoạt động trong browser thường)
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <tr className="bg-white dark:bg-content-dark border-b dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="w-4 p-4 align-middle">
                <div className="flex items-center">
                    <input
                        id={`checkbox-table-${post.id}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(post.id)}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                    <label htmlFor={`checkbox-table-${post.id}`} className="sr-only">checkbox</label>
                </div>
            </td>
            <td className="px-4 py-4 align-middle">
                <div className="flex items-center justify-center">
                    <input
                        type="number"
                        value={post.rowNumber ?? index}
                        onChange={(e) => {
                            const newNumber = parseInt(e.target.value) || index;
                            onRowNumberChange?.(post.id, newNumber);
                        }}
                        className="w-12 bg-transparent border border-gray-600 rounded px-1 py-1 text-center text-gray-500 dark:text-gray-400 font-medium focus:border-purple-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
            </td>
            <td className="px-4 py-4 align-top custom-scrollbar">
                <AutoResizeTextarea
                    value={post.content}
                    onChange={(e) => onContentChange(post.id, e.target.value)}
                    placeholder="Write your content here..."
                />
            </td>
            <td className="px-4 py-4 align-middle">
                <div className="flex flex-col gap-2">
                    <MediaInput 
                        media={post.media} 
                        onChange={(media) => onMediaChange(post.id, media)}
                        onMediaRemove={(newMedia) => onMediaRemove?.(post.id, newMedia)}
                    />
                    {/* ✅ Quick Fix Button - style giống Add URL */}
                    {post.media.length > 0 && post.media.some(m => m.type === 'image') && (
                        <button
                            onClick={() => onQuickFix?.(post.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:hover:bg-orange-500 dark:hover:text-white dark:hover:border-orange-500 transition-colors"
                            title="Edit images in Image Editor"
                        >
                            <MaterialSymbol icon="auto_fix_high" className="text-base" />
                            Quick Fix
                        </button>
                    )}
                </div>
            </td>
            {/* Task (Share Threads + Schedule + Post Now) */}
            <td className="px-4 py-4 align-middle">
                <div className="flex flex-col items-center gap-2">
                    {/* Import from Media Library Button */}
                    <button
                        onClick={() => onImportFromMediaLibrary?.(post.id)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30 hover:text-blue-200 transition"
                        title="Import images from Media Library"
                    >
                        <MaterialSymbol icon="collections" className="text-sm" />
                        Import
                    </button>

                    {/* Share Threads Checkbox - Di chuyển lên trên */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={post.shareToThreads || false}
                            onChange={(e) => onShareToThreadsChange(post.id, e.target.checked)}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Share Threads</span>
                    </label>

                    {/* Schedule Button */}
                    <div className="relative w-full" ref={pickerRef}>
                        <button
                            onClick={() => setIsPickerOpen(prev => !prev)}
                            className="w-full h-10 flex items-center justify-between px-3 rounded-lg border dark:border-gray-600 dark:bg-gray-800 hover:bg-gray-700 cursor-pointer text-left"
                            aria-label="Schedule Date and Time"
                        >
                            <span className={`text-xs ${post.scheduledTime ? 'text-white' : 'text-gray-400'}`}>
                                {formatDateForDisplay(post.scheduledTime)}
                            </span>
                            <MaterialSymbol icon="calendar_today" className="text-base text-white" />
                        </button>

                        {isPickerOpen && (
                            <DateTimePicker
                                value={post.scheduledTime ? new Date(post.scheduledTime) : null}
                                onChange={handleDateTimeChange}
                            />
                        )}
                    </div>

                    {/* Post Now Button */}
                    <button
                        onClick={() => onPostNow(post.id)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg btn-instagram px-3 py-2 text-sm font-bold">
                        <span>Post Now</span>
                    </button>
                </div>
            </td>

            {/* Status */}
            <td className="px-4 py-4 align-middle">
                <div className="flex flex-col h-full items-center justify-center gap-1">
                    {post.status === PostStatus.Scheduled && post.scheduledTime ? (
                        <div className="text-center p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-700 min-w-[120px]">
                            <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Scheduled</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">{formatDateForDisplay(post.scheduledTime)}</p>
                        </div>
                        ) : post.status === PostStatus.Missed && post.scheduledTime ? (
                        <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 min-w-[120px]">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">Missed</p>
                            <p className="text-xs text-red-600 dark:text-red-500">{formatDateForDisplay(post.scheduledTime)}</p>
                        </div>
                    ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            post.status === PostStatus.Posted ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                            post.status === PostStatus.Posting ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                            post.status === PostStatus.Failed ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                            post.status === PostStatus.Missed ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                            post.status === PostStatus.Scheduled ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                            {post.status}
                        </span>
                    )}
                    {/* Loading indicator for Posting status */}
                    {post.status === PostStatus.Posting && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            <MaterialSymbol icon="progress_activity" className="text-sm animate-spin" />
                            <span>Posting...</span>
                        </div>
                    )}
                    {/* ✅ FIX: Mở link bằng trình duyệt mặc định */}
                    {post.status === PostStatus.Posted && post.postedUrl && (
                        <button
                            onClick={() => handleOpenPostUrl(post.postedUrl!)}
                            className="text-xs text-blue-500 hover:underline mt-1 cursor-pointer bg-transparent border-none p-0"
                        >
                            View Post
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default PostRow;