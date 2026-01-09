
import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ReelHeaderProps {
    title: string;
    description: string;
    videoName: string;
    setVideoName: (name: string) => void;
    onImportVideo: () => void;
    onRemoveVideo: () => void;
    onSave: () => void;
    onExport: () => void;
    hasVideo: boolean;
    isProcessing: boolean;
}

const ReelHeader: React.FC<ReelHeaderProps> = ({ 
    title, description, videoName, setVideoName, 
    onImportVideo, onRemoveVideo, onSave, onExport, 
    hasVideo, isProcessing 
}) => {
    return (
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6 flex-shrink-0">
            <div className="flex items-center gap-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">{title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">{description}</p>
                </div>

                {hasVideo && (
                    <div className="relative">
                        <div className="flex items-center gap-2 bg-white dark:bg-content-dark px-3 py-2 rounded-xl border border-gray-200 dark:border-border-dark animate-in fade-in slide-in-from-left-2 shadow-sm">
                            <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-700">
                                <MaterialSymbol icon="video_settings" className="text-instagram-purple text-lg" />
                                <span className="text-sm font-medium text-gray-400 whitespace-nowrap">Reel Name</span>
                            </div>
                            <input 
                                type="text" 
                                value={videoName} 
                                onChange={(e) => setVideoName(e.target.value)}
                                placeholder="Enter video name..."
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 dark:text-white p-0 w-24 md:w-32"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                {!hasVideo ? (
                    <button 
                        onClick={onImportVideo}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg btn-instagram px-5 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
                    >
                        <MaterialSymbol icon="add_video" className="text-lg" />
                        Import Video
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={onRemoveVideo}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-border-dark px-4 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm"
                        >
                            <MaterialSymbol icon="delete" className="text-lg" />
                            Remove
                        </button>
                        
                        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-800 pl-3">
                            <button
                                onClick={onSave}
                                disabled={isProcessing || !videoName.trim()}
                                className={`flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-700 hover:bg-gray-600 px-4 text-sm font-bold text-white shadow-lg transition-all ${isProcessing ? 'animate-pulse cursor-wait' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <MaterialSymbol icon={isProcessing ? 'sync' : 'library_add'} className={`text-lg ${isProcessing ? 'animate-spin' : ''}`} />
                                {isProcessing ? 'Saving...' : 'Save'}
                            </button>

                            <button 
                                onClick={onExport}
                                disabled={isProcessing}
                                className="flex h-10 items-center justify-center gap-2 rounded-lg btn-instagram px-5 text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                <MaterialSymbol icon="download" className="text-lg" />
                                Export Reel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};

export default ReelHeader;
