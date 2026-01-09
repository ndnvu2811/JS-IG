import React, { useState } from 'react';
import { InstagramAccount } from '../types';
import BulkScheduleModal from '../components/content-management/BulkScheduleModal';
import { useReelsManagement } from '../hooks/useReelsManagement';
import ReelsHeader from '../components/reels-management/ReelsHeader';
import Toolbar from '../components/content-management/Toolbar';
import ReelsTable from '../components/reels-management/ReelsTable';
import MaterialSymbol from '../components/icons/MaterialSymbol';
import ImportFromScraperModalForReels from '../components/reels-management/ImportFromScraperModalForReels';
import ImportFromMediaLibraryModalForReels from '../components/reels-management/ImportFromMediaLibraryModalForReels';
import AutoEditConfirmModal from '../components/reels-management/AutoEditConfirmModal';

interface ReelsManagementProps {
    selectedAccount: InstagramAccount | null;
    onAccountChange: (account: InstagramAccount) => void;
    accounts: InstagramAccount[];
}

const ReelsManagement: React.FC<ReelsManagementProps> = ({ selectedAccount, onAccountChange, accounts }) => {
    const {
        reels,
        setReels,
        filter,
        setFilter,
        selectedReelIds,
        isScheduleModalOpen,
        setIsScheduleModalOpen,
        isAutoEditModalOpen,
        setIsAutoEditModalOpen,
        autoEditConfig,
        filteredReels,
        isAllSelected,
        handleSelectReel,
        handleSelectAll,
        handleContentChange,
        handleVideoChange,
        handlePostNow,
        handleScheduleChange,
        handleConfirmAdvancedBulkSchedule,
        handleBulkClearSchedule,
        handleBulkDelete,
        handleImportFromScraper,
        handleAddRow,
        handleShareToThreadsChange,
        handleSaveVideoToLibrary,
        handleRowNumberChange,
        handleEditVideos,
        handleConfirmAutoEdit,
    } = useReelsManagement(selectedAccount, accounts);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImportMediaModalOpen, setIsImportMediaModalOpen] = useState(false);
    const [currentReelId, setCurrentReelId] = useState<number | null>(null);
        
        const onImportComplete = () => {
            // ✅ Reset filter to 'All' to show newly imported posts
            setFilter('All');
            // ✅ Close modal after import
            setIsImportModalOpen(false);
    };

    if (!selectedAccount) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <MaterialSymbol icon="group_add" className="text-6xl text-gray-400 dark:text-gray-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Account Selected</h2>
                <p className="text-lg text-gray-500 dark:text-gray-400">Please add an Instagram account or select one to manage reels.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <ReelsHeader
                accounts={accounts}
                selectedAccount={selectedAccount}
                onAccountChange={onAccountChange}
                onBulkAdd={() => {}} // ← Empty function
            />

            <Toolbar
                selectedPostIds={selectedReelIds}
                onBulkSchedule={() => setIsScheduleModalOpen(true)}
                onBulkClearSchedule={handleBulkClearSchedule}
                onBulkDelete={handleBulkDelete}
                filter={filter}
                onFilterChange={setFilter}
            />

            <ReelsTable
                filteredReels={filteredReels}
                selectedReelIds={selectedReelIds}
                isAllSelected={isAllSelected}
                onImportFromScraper={() => setIsImportModalOpen(true)}
                onImportFromMediaLibrary={(reelId) => {
                    setCurrentReelId(reelId);
                    setIsImportMediaModalOpen(true);
                }}
                onEditVideos={handleEditVideos}
                onSelectAll={handleSelectAll}
                onSelectReel={handleSelectReel}
                onContentChange={handleContentChange}
                onVideoChange={handleVideoChange}
                onPostNow={handlePostNow}
                onScheduleChange={handleScheduleChange}
                onShareToThreadsChange={handleShareToThreadsChange}
                onAddRow={handleAddRow}
                onDeleteReel={(reelId) => {
                setReels(prev => prev.filter(r => r.id !== reelId));
            }}
            onAspectRatioChange={(reelId, ratio) => {
                setReels(prev => prev.map(r => 
                    r.id === reelId ? { ...r, aspectRatio: ratio } : r
                ));
            }}
                onSaveVideo={handleSaveVideoToLibrary}
                onRowNumberChange={handleRowNumberChange}
        />

            <BulkScheduleModal 
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSchedule={handleConfirmAdvancedBulkSchedule}
                selectedCount={selectedReelIds.size}
            />
            
            <ImportFromScraperModalForReels
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={(items) => {
                    handleImportFromScraper(items);
                    onImportComplete();
                }}
            />
            
            <ImportFromMediaLibraryModalForReels
                isOpen={isImportMediaModalOpen}
                onClose={() => setIsImportMediaModalOpen(false)}
                onImport={(items) => {
                    // Import video to the selected reel
                    if (currentReelId) {
                        const reel = filteredReels.find(r => r.id === currentReelId);
                        if (reel && items.length > 0) {
                            // For reels, we take the first video from selected folders
                            handleVideoChange(currentReelId, items[0]);
                        }
                    }
                    setIsImportMediaModalOpen(false);
                    setCurrentReelId(null);
                }}
                reelId={currentReelId || 0}
            />
            
            <AutoEditConfirmModal
                isOpen={isAutoEditModalOpen}
                onClose={() => setIsAutoEditModalOpen(false)}
                onConfirm={handleConfirmAutoEdit}
                videoCount={autoEditConfig?.videoCount || 0}
                textsCount={autoEditConfig?.textsCount || 0}
                logosCount={autoEditConfig?.logosCount || 0}
                hasMusic={autoEditConfig?.hasMusic || false}
            />
        </div>
    );
};

export default ReelsManagement;