import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface VideoWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoToReels: () => void;
}

const VideoWarningModal: React.FC<VideoWarningModalProps> = ({ isOpen, onClose, onGoToReels }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <MaterialSymbol icon="videocam" className="text-4xl" />
                        <h2 className="text-2xl font-bold">Content page is for IMAGES only!</h2>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 text-base mb-2">
                        Videos should be posted as <span className="font-bold text-pink-500">Reels</span>.
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Click the button below to navigate to Reels page.
                    </p>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onGoToReels}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold hover:from-pink-600 hover:to-orange-600 transition-all shadow-lg flex items-center gap-2"
                    >
                        <MaterialSymbol icon="arrow_forward" className="text-base" />
                        Go to Reels
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoWarningModal;