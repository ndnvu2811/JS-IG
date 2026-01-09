import React from 'react';
import { PostHistory, ReelHistory, CareHistory } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';

interface DayDetailModalProps {
    isOpen: boolean;
    date: Date | null;
    posts: PostHistory[];
    reels: ReelHistory[];
    care: CareHistory[];
    onClose: () => void;
    onDeletePost: (historyId: string) => void;
    onDeleteReel: (historyId: string) => void;
    onDeleteCare: (historyId: string) => void;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({
    isOpen,
    date,
    posts,
    reels,
    care,
    onClose,
    onDeletePost,
    onDeleteReel,
    onDeleteCare,
}) => {
    if (!isOpen || !date) return null;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return '--:--';
        const d = new Date(timeString);
        return d.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    };

    const totalActivities = posts.length + reels.length + care.length;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-3xl max-h-[80vh] bg-white dark:bg-content-dark rounded-xl shadow-2xl border border-border-dark overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-dark">
                    <div>
                        <h2 className="text-2xl font-bold dark:text-white">Activities</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(date)}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <MaterialSymbol icon="close" className="text-2xl text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {totalActivities === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <MaterialSymbol icon="event_busy" className="text-6xl text-gray-400 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No activities scheduled for this day</p>
                        </div>
                    ) : (
                        <>
                            {/* Care Activities */}
                            {care.length > 0 && (
                                <>
                                    <div className="px-6 pt-4">
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Care Activities
                                        </h3>
                                    </div>
                                    <div className="px-6 pb-4 space-y-2">
                                        {care.sort((a, b) => {
                                            const timeA = new Date(a.scheduledAt || a.executedAt || 0).getTime();
                                            const timeB = new Date(b.scheduledAt || b.executedAt || 0).getTime();
                                            return timeA - timeB;
                                        }).map((c, idx) => {
                                            const activityType = c.settings?.autoBrowseEnabled ? 'Browse' : 'Follow';
                                            const isCompleted = c.status === 'Completed';
                                            
                                            return (
                                                <div 
                                                    key={`care-${c.id}-${idx}`}
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors border border-border-dark"
                                                >
                                                    
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 text-center w-20">
                                                        {activityType}
                                                    </span>
                                                    <MaterialSymbol icon="favorite" className="text-pink-500 w-6" />
                                                    <span className="text-sm font-semibold text-white w-20">
                                                        {formatTime(c.scheduledAt || c.executedAt || '')}
                                                    </span>
                                                    <span className="text-sm text-gray-400 truncate flex-1">
                                                        {c.accounts.join(', ')}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium text-center w-24 ${
                                                        isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'
                                                    }`}>
                                                        {c.status}
                                                    </span>
                                                    <div className="w-10 flex justify-center">
                                                        {!isCompleted && (
                                                            <button
                                                                onClick={() => onDeleteCare(c.id)}
                                                                className="p-2 rounded-full text-red-500 hover:bg-red-900/20 transition-colors"
                                                            >
                                                                <MaterialSymbol icon="delete" className="text-xl" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Posts & Reels */}
                            {(posts.length > 0 || reels.length > 0) && (
                                <>
                                    <div className="px-6 pt-4">
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Posts & Reels
                                        </h3>
                                    </div>
                                    <div className="px-6 pb-4 space-y-2">
                                        {/* Posts */}
                                        {posts.sort((a, b) => {
                                            const timeA = new Date(a.postedAt || a.scheduledAt || 0).getTime();
                                            const timeB = new Date(b.postedAt || b.scheduledAt || 0).getTime();
                                            return timeA - timeB;
                                        }).map((post, idx) => {
                                            const isPosted = post.status === 'Posted';
                                            return (
                                                <div 
                                                    key={`post-${post.id}-${idx}`}
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors border border-border-dark"
                                                >
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-center w-20">
                                                        Post
                                                    </span>
                                                    <MaterialSymbol icon="article" className="text-blue-500 w-6" />
                                                    <span className="text-sm font-semibold text-white w-20">
                                                        {formatTime(post.postedAt || post.scheduledAt || '')}
                                                    </span>
                                                    <span className="text-sm text-gray-400 truncate flex-1">
                                                        {post.account}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium text-center w-24 ${
                                                        isPosted 
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : post.status === 'Missed'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-purple-500/20 text-purple-400'
                                                    }`}>
                                                        {post.status}
                                                    </span>
                                                    <div className="w-10 flex justify-center">
                                                        {!isPosted && (
                                                            <button
                                                                onClick={() => onDeletePost(post.id)}
                                                                className="p-2 rounded-full text-red-500 hover:bg-red-900/20 transition-colors"
                                                            >
                                                                <MaterialSymbol icon="delete" className="text-xl" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Reels */}
                                        {reels.sort((a, b) => {
                                            const timeA = new Date(a.postedAt || a.scheduledAt || 0).getTime();
                                            const timeB = new Date(b.postedAt || b.scheduledAt || 0).getTime();
                                            return timeA - timeB;
                                        }).map((reel, idx) => {
                                            const isPosted = reel.status === 'Posted';
                                            return (
                                                <div 
                                                    key={`reel-${reel.id}-${idx}`}
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors border border-border-dark"
                                                >                                                   
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-center w-20">
                                                        Reel
                                                    </span>
                                                    <MaterialSymbol icon="movie" className="text-purple-500 w-6" />
                                                    <span className="text-sm font-semibold text-white w-20">
                                                        {formatTime(reel.postedAt || reel.scheduledAt || '')}
                                                    </span>
                                                    <span className="text-sm text-gray-400 truncate flex-1">
                                                        {reel.account}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium text-center w-24 ${
                                                        isPosted 
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : reel.status === 'Missed'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-purple-500/20 text-purple-400'
                                                    }`}>
                                                        {reel.status}
                                                    </span>
                                                    <div className="w-10 flex justify-center">
                                                        {!isPosted && (
                                                            <button
                                                                onClick={() => onDeleteReel(reel.id)}
                                                                className="p-2 rounded-full text-red-500 hover:bg-red-900/20 transition-colors"
                                                            >
                                                                <MaterialSymbol icon="delete" className="text-xl" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border-dark bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Total: {totalActivities} activities</span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayDetailModal;