
import React, { useState, useEffect } from 'react';
import { Post } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';

interface SingleScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (dateTime: string) => void;
    post: Post | null;
}

const SingleScheduleModal: React.FC<SingleScheduleModalProps> = ({ isOpen, onClose, onSchedule, post }) => {
    const [dateTime, setDateTime] = useState('');

    useEffect(() => {
        if (isOpen && post?.scheduledTime) {
            // Format for datetime-local input
            const d = new Date(post.scheduledTime.replace(' ', 'T'));
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
            } else {
                 setDateTime('');
            }
        } else if (!isOpen) {
             setDateTime('');
        }
    }, [isOpen, post]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dateTime) {
            alert('Please select a date and time.');
            return;
        }
        onSchedule(dateTime);
        onClose(); 
    };
    
    const handleClear = () => {
        onSchedule('');
        onClose();
    };


    if (!isOpen || !post) {
        return null;
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'nn/mm/yyyy --:--';
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return 'nn/mm/yyyy --:--';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch (e) {
            return 'nn/mm/yyyy --:--';
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl dark:bg-content-dark border border-border-dark"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b dark:border-border-dark">
                    <h2 className="text-xl font-bold dark:text-white">Schedule Post</h2>
                    <button onClick={onClose} className="p-2 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close modal">
                        <MaterialSymbol icon="close" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <p className="text-sm dark:text-gray-300">
                        Select a date and time to schedule this post.
                    </p>
                    <div>
                        <label htmlFor="schedule-datetime-single" className="block mb-2 text-sm font-medium dark:text-gray-300">
                            Schedule Date & Time
                        </label>
                        <div className="relative w-full h-10 rounded-lg border dark:border-gray-600 dark:bg-gray-800 cursor-pointer">
                           <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                                <span className={dateTime ? 'text-white' : 'text-gray-400'}>
                                    {formatDate(dateTime)}
                                </span>
                                <MaterialSymbol icon="calendar_today" />
                            </div>
                            <input
                                id="schedule-datetime-single"
                                type="datetime-local"
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                required
                                aria-label="Schedule Date and Time"
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end items-center gap-4 pt-4">
                        {post?.scheduledTime && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="mr-auto px-4 py-2 text-sm font-medium text-red-600 bg-red-100 border border-red-300 rounded-lg dark:text-red-400 dark:bg-red-900/50 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-800"
                            >
                                Clear
                            </button>
                        )}
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium bg-gray-100 border border-gray-300 rounded-lg dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg btn-instagram"
                        >
                            <span>Apply</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SingleScheduleModal;