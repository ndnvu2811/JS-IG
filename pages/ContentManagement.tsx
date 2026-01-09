import React, { useState, useEffect } from 'react';
import { InstagramAccount, Post, PostStatus } from '../types';
import BulkScheduleModal from '../components/content-management/BulkScheduleModal';
import BulkAddPostsModal from '../components/content-management/BulkAddPostsModal';
import { useContentManagement } from '../hooks/useContentManagement';
import ContentHeader from '../components/content-management/ContentHeader';
import Toolbar from '../components/content-management/Toolbar';
import PostsTable from '../components/content-management/PostsTable';
import MaterialSymbol from '../components/icons/MaterialSymbol';
import ImportFromScraperModal from '../components/content-management/ImportFromScraperModal';
import ImportFromMediaLibraryModal from '../components/content-management/ImportFromMediaLibraryModal';

interface ContentManagementProps {
    selectedAccount: InstagramAccount | null;
    onAccountChange: (account: InstagramAccount) => void;
    accounts: InstagramAccount[];
}

const ContentManagement: React.FC<ContentManagementProps> = ({ selectedAccount, onAccountChange, accounts }) => {
    const {
        posts,
        setPosts,
        filter,
        setFilter,
        selectedPostIds,
        isScheduleModalOpen,
        setIsScheduleModalOpen,
        isBulkAddModalOpen,
        setIsBulkAddModalOpen,
        filteredPosts,
        isAllSelected,
        handleSelectPost,
        handleSelectAll,
        handleContentChange,
        handleTypeChange,
        handlePostNow,
        handleScheduleChange,
        handleConfirmAdvancedBulkSchedule,
        handleBulkClearSchedule,
        handleBulkDelete,
        handleBulkAddPosts,
        handleAddRow,
        handleMediaChange,
        handleMediaRemove,
        handleShareToThreadsChange,
        handleImportFromScraper,
        handleRowNumberChange,
        handleSaveMediaToLibrary,
        handleQuickFix,
    } = useContentManagement(selectedAccount, accounts);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImportMediaModalOpen, setIsImportMediaModalOpen] = useState(false);
    const [currentPostId, setCurrentPostId] = useState<number | null>(null);
    
    // Listen for media updates from Image Editor
    useEffect(() => {
        // Check for pending media update from localStorage
        const pendingUpdate = localStorage.getItem('pending-media-update');
        if (pendingUpdate) {
            try {
                const { postId, media } = JSON.parse(pendingUpdate);
                console.log('🎯 ContentManagement applying pending media update - postId:', postId, 'media count:', media.length);
                handleMediaChange(postId, media);
                localStorage.removeItem('pending-media-update');
            } catch (error) {
                console.error('❌ Failed to apply pending media update:', error);
                localStorage.removeItem('pending-media-update');
            }
        }
    }, [handleMediaChange]);
    
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
                <p className="text-lg text-gray-500 dark:text-gray-400">Please add an Instagram account or select one to manage content.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <ContentHeader
                accounts={accounts}
                selectedAccount={selectedAccount}
                onAccountChange={onAccountChange}
                onBulkAdd={() => setIsBulkAddModalOpen(true)}
            />

            <Toolbar
                selectedPostIds={selectedPostIds}
                onBulkSchedule={() => setIsScheduleModalOpen(true)}
                onBulkClearSchedule={handleBulkClearSchedule}
                onBulkDelete={handleBulkDelete}
                filter={filter}
                onFilterChange={setFilter}
            />

            <PostsTable
                filteredPosts={filteredPosts}
                selectedPostIds={selectedPostIds}
                isAllSelected={isAllSelected}
                onSelectAll={handleSelectAll}
                onSelectPost={handleSelectPost}
                onContentChange={handleContentChange}
                onTypeChange={handleTypeChange}
                onRowNumberChange={handleRowNumberChange}
                onPostNow={handlePostNow}
                onScheduleChange={handleScheduleChange}
                onMediaChange={handleMediaChange}
                onMediaRemove={handleMediaRemove}
                onShareToThreadsChange={handleShareToThreadsChange}
                onImportFromScraper={() => setIsImportModalOpen(true)}
                onImportFromMediaLibrary={(postId) => {
                    setCurrentPostId(postId);
                    setIsImportMediaModalOpen(true);
                }}
                onAddRow={handleAddRow}
                onQuickFix={handleQuickFix}
                onSaveMedia={handleSaveMediaToLibrary}
            />

            <BulkScheduleModal 
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSchedule={handleConfirmAdvancedBulkSchedule}
                selectedCount={selectedPostIds.size}
            />
            <BulkAddPostsModal
                isOpen={isBulkAddModalOpen}
                onClose={() => setIsBulkAddModalOpen(false)}
                onAddPosts={handleBulkAddPosts}
            />
            <ImportFromScraperModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={(items) => {
                    handleImportFromScraper(items);
                    onImportComplete();
                }}
            />
            <ImportFromMediaLibraryModal
                isOpen={isImportMediaModalOpen}
                onClose={() => setIsImportMediaModalOpen(false)}
                onImport={(items) => {
                    // Import media to the selected post
                    if (currentPostId) {
                        const post = filteredPosts.find(p => p.id === currentPostId);
                        if (post) {
                            handleMediaChange(currentPostId, [...post.media, ...items]);
                        }
                    }
                    setIsImportMediaModalOpen(false);
                    setCurrentPostId(null);
                }}
                postId={currentPostId || 0}
            />
        </div>
    );
};

export default ContentManagement;