import React, { useState } from 'react';
import { useScraper } from '../hooks/useScraper';
import { ScraperResult, InstagramAccount } from '../types';

// Import components
import {
    ScraperHeader,
    ScraperConfigForm,
    ScraperResultsTable,
    ScraperMediaPreview,
    DownloadByUrl
} from '../components/scraper/';

type TabType = 'download' | 'config' | 'results';

interface InstagramScraperProps {
    accounts?: InstagramAccount[];
}

const InstagramScraper: React.FC<InstagramScraperProps> = ({ accounts = [] }) => {
    // Tab state
    const [activeTab, setActiveTab] = useState<'download' | 'config' | 'results'>('download');
    const [previewResultId, setPreviewResultId] = useState<string | null>(null);
    // Description state
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [pageDescription, setPageDescription] = useState('Scrape Instagram posts and reels with Apify');

    // Scraper hook
    const {
        config,
        setConfig,
        results,
        setResults,
        updateResult,
        runStatus,
        error,
        isLoading,
        runScraper,
        cancelScraper,
        exportResults,
        downloadPostByUrl,
        cancelDownload,
        downloadProgress
    } = useScraper();

    // Media preview state
    const [mediaPreview, setMediaPreview] = useState<{
        isOpen: boolean;
        images: string[];
        currentIndex: number;
    }>({
        isOpen: false,
        images: [],
        currentIndex: 0
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        setResults(prev => prev.filter(r => !selectedIds.has(r.id)));
        setSelectedIds(new Set());
    };

    // Handlers
    const openMediaPreview = (res: ScraperResult) => {
        const images: string[] = [];
        if (res.media && res.media.length > 0) {
            res.media.forEach(m => images.push(m.url));
        } else if (res.imageUrl) {
            images.push(res.imageUrl);
        }
        if (images.length > 0) {
            setPreviewResultId(res.id);
            setMediaPreview({ isOpen: true, images, currentIndex: 0 });
        }
    };

    const closeMediaPreview = () => {
        setMediaPreview({ isOpen: false, images: [], currentIndex: 0 });
        setPreviewResultId(null);
    };

    const handleDeleteImage = (index: number) => {
        if (!previewResultId) return;

        const currentResult = results.find(r => r.id === previewResultId);
        if (!currentResult) return;

        const newMedia = currentResult.media?.filter((_, i) => i !== index) || [];
        const newImageUrl = newMedia.length > 0 ? newMedia[0].url : '';

        updateResult(previewResultId, {
            media: newMedia,
            imageUrl: newImageUrl
        });

        const newImages = mediaPreview.images.filter((_, i) => i !== index);
        if (newImages.length === 0) {
            closeMediaPreview();
        } else {
            setMediaPreview(prev => ({ ...prev, images: newImages }));
        }
    };

    const handleFieldChange = (id: string, field: keyof ScraperResult, value: string) => {
        updateResult(id, { [field]: value });
    };

    const handleAddRow = () => {
        const newRow: ScraperResult = {
            id: `manual-${Date.now()}`,
            stt: results.length + 1,
            url: '',
            status: 'Draft',
            imageUrl: '',
            caption: '',
            captionNew: '',
            media: [],
            timestamp: new Date().toISOString()
        };
        setResults([...results, newRow]);
    };

    // Handle download with progress tracking
    const handleDownload = async (urls: string[], contentType: 'post' | 'reel', startingNumber: number) => {
    console.log('🔴 DEBUG InstagramScraper handleDownload:', { urls: urls.length, contentType, startingNumber });
    await downloadPostByUrl(urls, contentType, startingNumber);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header with Tabs */}
            <ScraperHeader
                pageDescription={pageDescription}
                isEditingDesc={isEditingDesc}
                activeTab={activeTab}
                resultsCount={results.length}
                onDescriptionChange={setPageDescription}
                onEditingChange={setIsEditingDesc}
                onTabChange={setActiveTab}
            />

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'download' ? (
                    <DownloadByUrl
                        accounts={accounts}
                        onDownload={handleDownload}
                        onCancel={cancelDownload}
                        isLoading={isLoading}
                        progress={downloadProgress}
                    />
                ) : activeTab === 'config' ? (
                    <ScraperConfigForm
                        config={config}
                        runStatus={runStatus}
                        error={error}
                        isLoading={isLoading}
                        onConfigChange={setConfig}
                        onRunScraper={runScraper}
                        onCancelScraper={cancelScraper}
                        onSwitchToResults={() => setActiveTab('results')}
                    />
                ) : (
                    <ScraperResultsTable
                        results={results}
                        isLoading={isLoading}
                        statusMessage={runStatus.message}
                        progress={runStatus.progress}
                        onFieldChange={handleFieldChange}
                        onAddRow={handleAddRow}
                        selectedIds={selectedIds}
                        onSelectChange={setSelectedIds}
                        onDeleteSelected={handleDeleteSelected}
                        onExport={exportResults}
                        onMediaPreview={openMediaPreview}
                        onGoToConfig={() => setActiveTab('config')}
                    />
                )}
            </div>

            {/* Media Preview Modal */}
            <ScraperMediaPreview
                isOpen={mediaPreview.isOpen}
                images={mediaPreview.images}
                onClose={closeMediaPreview}
                onDeleteImage={handleDeleteImage}
            />
        </div>
    );
};

export default InstagramScraper;