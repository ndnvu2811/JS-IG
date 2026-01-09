import { useState } from 'react';
import { Reel, ReelStatus } from '../../types';
import { getReelConfig } from '../../utils/library';
import { hybridRender } from '../../utils/canvasFramesRenderer';

export interface AutoEditConfig {
    videoCount: number;
    textsCount: number;
    logosCount: number;
    hasMusic: boolean;
}

export const useReelsEdit = (reels: Reel[], setReels: (reels: any) => void) => {
    const [isAutoEditModalOpen, setIsAutoEditModalOpen] = useState(false);
    const [autoEditConfig, setAutoEditConfig] = useState<AutoEditConfig | null>(null);

    const handleEditVideos = async () => {
        console.log('\n🎬 ========== EDIT BUTTON CLICKED ==========');
        
        try {
            // 1. Get saved configuration (NOT session - config persists without video)
            console.log('📥 Step 1: Loading Reel Editor config...');
            
            const reelConfig = await getReelConfig();
            
            console.log('Config result:', reelConfig);
            
            if (!reelConfig) {
                console.error('❌ No config found!');
                alert('No Reel Editor configuration found. Please configure your settings in Edit Reel page first.');
                return;
            }

            console.log('✅ Config loaded:', {
                texts: reelConfig.texts?.length || 0,
                logos: reelConfig.logos?.length || 0,
                videoScale: reelConfig.videoScale,
                musicUrl: !!reelConfig.musicUrl
            });

            // Check if there are any texts or logos configured
            const hasConfiguration = (reelConfig.texts?.length || 0) > 0 || (reelConfig.logos?.length || 0) > 0;
            console.log('Has configuration?', hasConfiguration);
            
            if (!hasConfiguration) {
                console.warn('⚠️ No text or logo configuration!');
                alert('No text or logo configuration found. Please add at least one text or logo in Edit Reel page.');
                return;
            }

            // 2. Filter reels with video that have "ready" status or no status
            console.log('📹 Step 2: Filtering videos...');
            
            const reelsToProcess = reels.filter(reel => {
                const hasVideo = reel.video && reel.video.url && reel.video.url.trim() !== '';
                const isReady = !reel.processingStatus || reel.processingStatus === 'ready';
                console.log(`  Reel #${reel.id}: hasVideo=${hasVideo}, isReady=${isReady}`);
                return hasVideo && isReady;
            });

            console.log('Videos to process:', reelsToProcess.length);

            if (reelsToProcess.length === 0) {
                console.warn('⚠️ No videos found!');
                alert('No videos found to process. Please upload videos with "Video ready" status first.');
                return;
            }

            // 3. Show confirmation modal
            console.log('🎨 Step 3: Opening modal...');
            setAutoEditConfig({
                videoCount: reelsToProcess.length,
                textsCount: reelConfig.texts?.length || 0,
                logosCount: reelConfig.logos?.length || 0,
                hasMusic: !!reelConfig.musicUrl
            });
            setIsAutoEditModalOpen(true);

        } catch (error) {
            console.error('❌ Error in handleEditVideos:', error);
            alert('An error occurred. Please try again.');
        }
    };

    const handleConfirmAutoEdit = async () => {
        setIsAutoEditModalOpen(false);
        
        console.log('\n🎬 ========== AUTO EDIT STARTED ==========');
        
        try {
            // 1. Get config
            const reelConfig = await getReelConfig();
            
            if (!reelConfig) {
                alert('No configuration found. Please configure Edit Reel first.');
                return;
            }
            
            console.log('✅ Config loaded:', {
                texts: reelConfig.texts?.length || 0,
                logos: reelConfig.logos?.length || 0
            });

            // 2. Filter videos to process (ready status only)
            const reelsToProcess = reels.filter(reel => 
                reel.video && reel.video.url && reel.video.url.trim() !== '' &&
                (!reel.processingStatus || reel.processingStatus === 'ready')
            );

            console.log(`📹 Processing ${reelsToProcess.length} video(s)...`);

            if (reelsToProcess.length === 0) {
                alert('No videos found to process.');
                return;
            }

            // 3. Set all to "processing" status
            setReels((prev: Reel[]) => prev.map(r => {
                if (reelsToProcess.find(rp => rp.id === r.id)) {
                    return { ...r, processingStatus: 'processing' as const, processingProgress: 0 };
                }
                return r;
            }));

            await new Promise(resolve => setTimeout(resolve, 100));

            // 4. Process each video
            let processedCount = 0;
            
            for (let i = 0; i < reelsToProcess.length; i++) {
                const reel = reelsToProcess[i];
                
                console.log(`\n📹 Processing video ${i + 1}/${reelsToProcess.length} (Reel #${reel.id})`);
                
                try {
                    // Create session from config + current video
                    const session = {
                        videoUrl: reel.video.url,
                        videoScale: reelConfig.videoScale || 100,
                        videoX: reelConfig.videoX || 0,
                        videoY: reelConfig.videoY || 0,
                        musicUrl: reelConfig.musicUrl || null,
                        originalVolume: reelConfig.originalVolume || 100,
                        musicVolume: reelConfig.musicVolume || 50,
                        texts: reelConfig.texts || [],
                        logos: reelConfig.logos || []
                    };

                    // Update progress
                    setReels((prev: Reel[]) => prev.map(r => 
                        r.id === reel.id ? { ...r, processingProgress: 10 } : r
                    ));

                    // Render with hybridRender
                    const result = await hybridRender(
                        reel.video.url,
                        session,
                        (progress, stage) => {
                            console.log(`  Progress: ${progress}% - ${stage}`);
                            setReels((prev: Reel[]) => prev.map(r => 
                                r.id === reel.id ? { ...r, processingProgress: progress } : r
                            ));
                        }
                    );

                    if (!result.success) {
                        throw new Error(result.error || 'Render failed');
                    }

                    console.log(`✅ Rendered: ${result.videoPath}`);

                    // Update reel with NEW video (replace original)
                    setReels((prev: Reel[]) => prev.map(r => 
                        r.id === reel.id 
                            ? { 
                                ...r, 
                                video: { url: `media-file://${result.videoPath}` },
                                updatedAt: new Date().toISOString(),
                                processingStatus: 'adjusted' as const,
                                processingProgress: 100
                            }
                            : r
                    ));

                    processedCount++;
                    console.log(`✅ Completed ${processedCount}/${reelsToProcess.length}`);

                    // Small delay between videos
                    if (i < reelsToProcess.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                } catch (error) {
                    console.error(`❌ Error processing Reel #${reel.id}:`, error);
                    
                    setReels((prev: Reel[]) => prev.map(r => 
                        r.id === reel.id 
                            ? { ...r, processingStatus: 'failed' as const, processingProgress: 0 }
                            : r
                    ));
                    
                    // Continue with next video
                }
            }

            console.log(`\n🎉 AUTO EDIT COMPLETED: ${processedCount}/${reelsToProcess.length} videos`);

        } catch (error) {
            console.error('❌ Fatal error:', error);
            alert('An error occurred while processing videos.');
        }
    };

    return {
        isAutoEditModalOpen,
        setIsAutoEditModalOpen,
        autoEditConfig,
        setAutoEditConfig,
        handleEditVideos,
        handleConfirmAutoEdit,
    };
};
