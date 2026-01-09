import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface AutoEditConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    videoCount: number;
    textsCount: number;
    logosCount: number;
    hasMusic: boolean;
}

const AutoEditConfirmModal: React.FC<AutoEditConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    videoCount,
    textsCount,
    logosCount,
    hasMusic
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <MaterialSymbol icon="auto_fix_high" className="text-white text-xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Auto Edit Videos
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <MaterialSymbol icon="close" className="text-xl text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        This will apply current Edit Reel configuration to <span className="font-bold text-purple-600 dark:text-purple-400">{videoCount} video{videoCount > 1 ? 's' : ''}</span>.
                    </p>

                    {/* Configuration Details */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Configuration:</span>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <MaterialSymbol icon="title" className="text-base text-purple-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Texts: <span className="font-semibold">{textsCount}</span>
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <MaterialSymbol icon="image" className="text-base text-pink-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Logos: <span className="font-semibold">{logosCount}</span>
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <MaterialSymbol icon="music_note" className="text-base text-blue-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Music: <span className="font-semibold">{hasMusic ? 'Yes' : 'No'}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <MaterialSymbol icon="info" className="text-amber-600 dark:text-amber-400 text-xl mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            This process may take a few minutes depending on video count and length. Please wait until completion.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 rounded-b-2xl flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 btn-instagram rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                    >
                        <MaterialSymbol icon="check" className="text-base" />
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AutoEditConfirmModal;
