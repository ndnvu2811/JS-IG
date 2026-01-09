import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ReelSession, TextOverlay, LogoOverlay, MediaLibraryItem } from '../types';
import ReelHeader from '../components/reel-editor/ReelHeader';
import ReelWorkspace from '../components/reel-editor/ReelWorkspace';
import ReelSidebar from '../components/reel-editor/ReelSidebar';
import ImportVideoModal from '../components/reel-editor/ImportVideoModal';
import { 
    addMediaItems, 
    saveReelSession, 
    getReelSession, 
    clearReelSession,
    saveReelConfig,
    getReelConfig,
    clearReelConfig,
    ReelConfig
} from '../utils/library';
import MaterialSymbol from '../components/icons/MaterialSymbol';
import { cancelActiveRender, resetRenderState, hybridRender } from '../utils/canvasFramesRenderer';

const DEFAULT_SESSION: ReelSession = {
    videoUrl: null, 
    videoScale: 100,
    videoX: 0,
    videoY: 0,
    musicUrl: null,
    originalVolume: 100,
    musicVolume: 50,
    texts: [],
    logos: []
};

const EditReel: React.FC = () => {
    const [reelName, setReelName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [session, setSession] = useState<ReelSession>(DEFAULT_SESSION);
    const [progressStage, setProgressStage] = useState<string>('');
    const [isImportVideoModalOpen, setIsImportVideoModalOpen] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const musicInputRef = useRef<HTMLInputElement>(null);
    
    const cancelRenderRef = useRef(false);
    const renderActiveRef = useRef(false);
    const renderSessionIdRef = useRef<string | null>(null);

    const muteAllAudio = useCallback(() => {
        document.querySelectorAll('video').forEach((video) => {
            video.muted = true;
            video.volume = 0;
        });
        document.querySelectorAll('audio').forEach((audio) => {
            audio.muted = true;
            audio.volume = 0;
            audio.pause();
        });
    }, []);

    useEffect(() => {
        const handleProgress = (data: { stage: string; percent?: number }) => {
            if (data.stage === 'encoding' || data.stage === 'encoding (CPU)') {
                setProgressStage('Encoding video...');
                setExportProgress(10 + Math.round((data.percent || 0) * 0.9));
            } else if (data.stage === 'complete') {
                setProgressStage('Complete!');
                setExportProgress(100);
            }
        };

        if ((window as any).electronAPI?.onRenderProgress) {
            const unsubscribe = (window as any).electronAPI.onRenderProgress(handleProgress);
            return () => {
                if (typeof unsubscribe === 'function') unsubscribe();
            };
        }
    }, []);

    // ✅ Load session AND config on mount
    useEffect(() => {
        const load = async () => {
            try {
                // Load saved session (includes video)
                const savedSession = await getReelSession();
                // Load saved config (texts, logos, settings)
                const savedConfig = await getReelConfig();
                
                if (savedSession || savedConfig) {
                    setSession({
                        // Video from session
                        videoUrl: savedSession?.videoUrl || null,
                        // Config from saved config (priority) or session
                        videoScale: savedConfig?.videoScale ?? savedSession?.videoScale ?? 100,
                        videoX: savedConfig?.videoX ?? savedSession?.videoX ?? 0,
                        videoY: savedConfig?.videoY ?? savedSession?.videoY ?? 0,
                        musicUrl: savedConfig?.musicUrl ?? savedSession?.musicUrl ?? null,
                        originalVolume: savedConfig?.originalVolume ?? savedSession?.originalVolume ?? 100,
                        musicVolume: savedConfig?.musicVolume ?? savedSession?.musicVolume ?? 50,
                        texts: savedConfig?.texts ?? savedSession?.texts ?? [],
                        logos: savedConfig?.logos ?? savedSession?.logos ?? []
                    });
                    setReelName(localStorage.getItem('reel-editor-name') || '');
                }
            } catch (e) {
                console.error("Failed to load reel session", e);
            } finally {
                setIsLoadingSession(false);
            }
        };
        load();

        return () => {
            cancelRenderRef.current = true;
            renderActiveRef.current = false;
            cancelActiveRender();
            muteAllAudio();
        };
    }, [muteAllAudio]);

    // ✅ Save both session AND config on changes
    useEffect(() => {
        if (!isLoadingSession) {
            // Save full session (includes video)
            saveReelSession(session).catch(console.error);
            
            // Save config separately (WITHOUT video) - persists for future videos
            const config: ReelConfig = {
                texts: session.texts,
                logos: session.logos,
                videoScale: session.videoScale,
                videoX: session.videoX,
                videoY: session.videoY,
                originalVolume: session.originalVolume,
                musicVolume: session.musicVolume,
                musicUrl: session.musicUrl
            };
            saveReelConfig(config).catch(console.error);
        }
    }, [session, isLoadingSession]);

    const handleExport = useCallback(async () => {
        if (renderActiveRef.current || isProcessing) return;

        if (!session.videoUrl) {
            alert('Please add a video before exporting!');
            return;
        }

        renderActiveRef.current = true;
        const sessionId = `export_${Date.now()}`;
        renderSessionIdRef.current = sessionId;

        cancelRenderRef.current = false;
        setIsProcessing(true);
        setExportProgress(0);
        setProgressStage('Preparing...');

        muteAllAudio();
        resetRenderState();

        try {
            setProgressStage('Creating overlay...');
            setExportProgress(5);
            
            const renderResult = await hybridRender(
                session.videoUrl,
                session,
                (progress, stage) => {
                    setExportProgress(progress);
                    setProgressStage(stage);
                }
            );

            if (cancelRenderRef.current || renderSessionIdRef.current !== sessionId) {
                return;
            }

            if (!renderResult.success) {
                throw new Error(renderResult.error || 'Failed to render video');
            }

            if (renderResult.videoPath) {
                const newItem: MediaLibraryItem = {
                    id: `reel_${Date.now()}`,
                    name: reelName || 'Exported Reel',
                    type: 'video',
                    url: `media-file://${renderResult.videoPath}`,
                    size: 0,
                    createdAt: new Date().toISOString()
                };

                try {
                    await addMediaItems([newItem]);
                } catch (e) {
                    console.warn('Failed to add to library:', e);
                }
            }

            setExportProgress(100);
            setProgressStage('Complete!');

        } catch (error) {
            console.error('Export error:', error);
            if (!cancelRenderRef.current) {
                alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        } finally {
            setTimeout(() => {
                renderActiveRef.current = false;
                renderSessionIdRef.current = null;
                setIsProcessing(false);
                setExportProgress(0);
                setProgressStage('');
            }, 2000);
        }
    }, [session, reelName, isProcessing, muteAllAudio]);

    const handleCancelExport = useCallback(() => {
        cancelRenderRef.current = true;
        renderActiveRef.current = false;
        cancelActiveRender();
        muteAllAudio();
        setIsProcessing(false);
        setExportProgress(0);
        setProgressStage('');
    }, [muteAllAudio]);

    const handleSave = useCallback(async () => {
        if (!reelName.trim()) {
            alert('Please enter a name for the reel');
            return;
        }

        try {
            localStorage.setItem('reel-editor-name', reelName);
            await saveReelSession(session);
            alert('Saved successfully!');
        } catch (error) {
            alert('Save failed: ' + (error instanceof Error ? error.message : String(error)));
        }
    }, [session, reelName]);

    // ✅ Clear only video, keep config
    const handleRemoveVideo = useCallback(async () => {
        muteAllAudio();
        
        // Only clear video, keep everything else
        setSession(prev => ({
            ...prev,
            videoUrl: null
        }));
        setReelName('');
        localStorage.removeItem('reel-editor-name');
    }, [muteAllAudio]);

    // ✅ Clear everything including config
    const handleClearAll = useCallback(async () => {
        if (!confirm('Clear ALL including texts, logos and settings? This cannot be undone.')) {
            return;
        }

        muteAllAudio();
        
        try {
            await clearReelSession();
            await clearReelConfig();
            setSession(DEFAULT_SESSION);
            setReelName('');
            localStorage.removeItem('reel-editor-name');
        } catch (error) {
            console.error('Clear error:', error);
        }
    }, [muteAllAudio]);

    const handleImportVideoFromLibrary = useCallback(async (mediaItem: MediaLibraryItem) => {
        try {
            console.log('📥 Importing video from Media Library:', mediaItem.name, mediaItem.url.substring(0, 50));
            
            // Directly use the URL from Media Library
            // Media Library already stores videos as data URLs or media-file:// paths
            setSession(prev => ({ ...prev, videoUrl: mediaItem.url }));
            
            if (!reelName) {
                setReelName(mediaItem.name.replace(/\.[^/.]+$/, ''));
            }
            
            console.log('✅ Video imported successfully');
        } catch (error) {
            console.error('❌ Failed to import video:', error);
            alert('Failed to import video: ' + (error instanceof Error ? error.message : String(error)));
        }
    }, [reelName]);

    const handleVideoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const dataUrl = await fileToBase64DataUrl(file);
            // ✅ Only update video, keep existing config
            setSession(prev => ({ ...prev, videoUrl: dataUrl }));
            
            if (!reelName) {
                setReelName(file.name.replace(/\.[^/.]+$/, ''));
            }
        } catch (error) {
            alert('Failed to load video');
        }

        e.target.value = '';
    }, [reelName]);

    const handleLogoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const dataUrl = await fileToBase64DataUrl(file);
            const newLogo: LogoOverlay = {
                id: `logo_${Date.now()}`,
                url: dataUrl,
                x: 50,
                y: 90,
                size: 15,
                opacity: 100
            };
            
            setSession(prev => ({ ...prev, logos: [...prev.logos, newLogo] }));
        } catch (error) {
            alert('Failed to load logo');
        }

        e.target.value = '';
    }, []);

    const handleMusicSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const dataUrl = await fileToBase64DataUrl(file);
            setSession(prev => ({ ...prev, musicUrl: dataUrl }));
        } catch (error) {
            alert('Failed to load music');
        }

        e.target.value = '';
    }, []);

    const addText = useCallback(() => {
        const newText: TextOverlay = {
            id: `text_${Date.now()}`,
            text: 'New Caption',
            x: 50,
            y: 30,
            fontSize: 24,
            color: '#FFFFFF'
        };
        setSession(prev => ({ ...prev, texts: [...prev.texts, newText] }));
    }, []);

    const updateText = useCallback((id: string, updates: Partial<TextOverlay>) => {
        setSession(prev => ({
            ...prev,
            texts: prev.texts.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
    }, []);

    const removeText = useCallback((id: string) => {
        setSession(prev => ({ ...prev, texts: prev.texts.filter(t => t.id !== id) }));
    }, []);

    const updateLogo = useCallback((id: string, updates: Partial<LogoOverlay>) => {
        setSession(prev => ({
            ...prev,
            logos: prev.logos.map(l => l.id === id ? { ...l, ...updates } : l)
        }));
    }, []);

    const removeLogo = useCallback((id: string) => {
        setSession(prev => ({ ...prev, logos: prev.logos.filter(l => l.id !== id) }));
    }, []);

    const removeMusic = useCallback(() => {
        muteAllAudio();
        setSession(prev => ({ ...prev, musicUrl: null }));
    }, [muteAllAudio]);

    if (isLoadingSession) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
            <ReelHeader 
                title="Reel Editor"
                description="Edit your 9:16 videos"
                videoName={reelName}
                setVideoName={setReelName}
                onImportVideo={() => setIsImportVideoModalOpen(true)}
                onRemoveVideo={handleRemoveVideo}
                onSave={handleSave}
                onExport={handleExport}
                hasVideo={!!session.videoUrl}
                isProcessing={isProcessing}
            />

            <div className="flex flex-1 gap-3 overflow-hidden p-3">
                <div className="flex-[2] min-w-0">
                    <ReelWorkspace 
                        videoUrl={session.videoUrl}
                        videoScale={session.videoScale}
                        setVideoScale={(scale) => setSession(s => ({ ...s, videoScale: scale }))}
                        videoX={session.videoX}
                        videoY={session.videoY}
                        musicUrl={session.musicUrl}
                        originalVolume={session.originalVolume}
                        musicVolume={session.musicVolume}
                        texts={session.texts}
                        logos={session.logos}
                        onTextMove={(id, x, y) => updateText(id, { x, y })}
                        onLogoMove={(id, x, y) => updateLogo(id, { x, y })}
                        onImportClick={() => setIsImportVideoModalOpen(true)}
                    />
                </div>

                <ReelSidebar 
                    videoScale={session.videoScale}
                    setVideoScale={(scale) => setSession(s => ({ ...s, videoScale: scale }))}
                    videoX={session.videoX}
                    setVideoX={(x) => setSession(s => ({ ...s, videoX: x }))}
                    videoY={session.videoY}
                    setVideoY={(y) => setSession(s => ({ ...s, videoY: y }))}
                    originalVolume={session.originalVolume}
                    setOriginalVolume={(volume) => setSession(s => ({ ...s, originalVolume: volume }))}
                    musicUrl={session.musicUrl}
                    musicVolume={session.musicVolume}
                    setMusicVolume={(volume) => setSession(s => ({ ...s, musicVolume: volume }))}
                    onImportMusic={() => musicInputRef.current?.click()}
                    onRemoveMusic={removeMusic}
                    texts={session.texts}
                    onAddText={addText}
                    onRemoveText={removeText}
                    onUpdateText={updateText}
                    logos={session.logos}
                    onImportLogo={() => logoInputRef.current?.click()}
                    onUpdateLogo={updateLogo}
                    onRemoveLogo={removeLogo}
                />
            </div>

            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
            <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={handleMusicSelect} />

            <ImportVideoModal 
                isOpen={isImportVideoModalOpen}
                onClose={() => setIsImportVideoModalOpen(false)}
                onImport={handleImportVideoFromLibrary}
            />

            {isProcessing && (
                <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 w-72">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-white">Exporting...</span>
                            </div>
                            <button
                                onClick={handleCancelExport}
                                className="text-gray-400 hover:text-red-400 transition-colors"
                                title="Cancel"
                            >
                                <MaterialSymbol icon="close" className="text-lg" />
                            </button>
                        </div>
                        
                        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                            <div 
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                                style={{ width: `${exportProgress}%` }}
                            />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{progressStage}</span>
                            <span className="text-blue-400 font-medium">{exportProgress}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

async function fileToBase64DataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default EditReel;