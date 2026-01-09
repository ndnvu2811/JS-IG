
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageSession, FilterState, CropBox, AspectRatio, MediaLibraryItem } from '../types';
import { addMediaItems, saveEditorSession, getEditorSession, clearEditorSession, getAllMediaItems, deleteMediaItem } from '../utils/library.ts';
import { getMediaUrl } from '../utils/mediaUtils';
import EditorHeader from '../components/image-editor/EditorHeader';
import EditorWorkspace from '../components/image-editor/EditorWorkspace';
import EditorSidebar from '../components/image-editor/EditorSidebar';

const DEFAULT_FILTERS: FilterState = {
    brightness: 100, contrast: 100, saturate: 100, sepia: 0, grayscale: 0, hueRotate: 0, blur: 0
};

const ImageEditor: React.FC = () => {
    const [imageQueue, setImageQueue] = useState<ImageSession[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [batchName, setBatchName] = useState(() => localStorage.getItem('editor-batch-name') || '');

    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
    const [rotation, setRotation] = useState(0);
    const [isFlippedH, setIsFlippedH] = useState(false);
    const [isFlippedV, setIsFlippedV] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 100 });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const workspaceRef = useRef<HTMLDivElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);

    const activeSession = imageQueue[currentIndex] || null;

    useEffect(() => {
        const load = async () => {
            const saved = await getEditorSession();
            if (saved && saved.length > 0) {
                setImageQueue(saved);
                const lastIdx = parseInt(localStorage.getItem('editor-last-index') || '0');
                setCurrentIndex(Math.min(lastIdx, saved.length - 1));
            }
            setIsLoadingSession(false);
        };
        load();
    }, []);

    const syncCurrentToQueue = useCallback(() => {
        if (imageQueue.length === 0 || isLoadingSession) return;
        setImageQueue(prev => {
            const next = [...prev];
            if (next[currentIndex]) {
                next[currentIndex] = { ...next[currentIndex], filters, aspectRatio, rotation, isFlippedH, isFlippedV, cropBox, zoom };
            }
            return next;
        });
    }, [currentIndex, filters, aspectRatio, rotation, isFlippedH, isFlippedV, cropBox, zoom, imageQueue.length, isLoadingSession]);

    useEffect(() => {
        if (!isLoadingSession) {
            saveEditorSession(imageQueue);
            localStorage.setItem('editor-last-index', currentIndex.toString());
            localStorage.setItem('editor-batch-name', batchName);
        }
    }, [imageQueue, currentIndex, isLoadingSession, batchName]);

    const calculateInitialFit = useCallback(() => {
        if (!imageRef.current || !workspaceRef.current) return;
        const workspace = workspaceRef.current;
        const img = imageRef.current;
        const padding = 120; 
        const availableW = workspace.clientWidth - padding;
        const availableH = workspace.clientHeight - padding;
        const fitScale = Math.min(availableW / img.naturalWidth, availableH / img.naturalHeight, 1) * 100;
        setZoom(Math.floor(fitScale));
    }, []);

    useEffect(() => {
        if (activeSession) {
            setFilters(activeSession.filters); setAspectRatio(activeSession.aspectRatio);
            setRotation(activeSession.rotation); setIsFlippedH(activeSession.isFlippedH);
            setIsFlippedV(activeSession.isFlippedV); setCropBox(activeSession.cropBox);
            setZoom(activeSession.zoom);
            if (activeSession.zoom === 100) setTimeout(calculateInitialFit, 50);
        }
    }, [currentIndex, activeSession?.url, calculateInitialFit]);

    useEffect(() => {
        if (imageQueue.length > 0) {
            setIsSyncing(true);
            const timer = setTimeout(() => {
                syncCurrentToQueue();
                setIsSyncing(false);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [filters, aspectRatio, rotation, isFlippedH, isFlippedV, cropBox, zoom, syncCurrentToQueue]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        // Lấy filter hiện tại để áp dụng cho ảnh mới
        const currentFilters = imageQueue.length > 0 ? imageQueue[0].filters : DEFAULT_FILTERS;
        const currentAspectRatio = imageQueue.length > 0 ? imageQueue[0].aspectRatio : 'free';
        
        const readers = Array.from(files).map((file: File) => {
            return new Promise<ImageSession>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    resolve({
                        url: event.target?.result as string, 
                        name: file.name.split('.')[0],
                        filters: { ...currentFilters }, // ✅ Giữ lại filter hiện tại
                        aspectRatio: currentAspectRatio, // ✅ Giữ lại aspect ratio
                        rotation: 0,
                        isFlippedH: false, 
                        isFlippedV: false, 
                        cropBox: { x: 0, y: 0, width: 100, height: 100 }, 
                        zoom: 100
                    });
                };
                reader.readAsDataURL(file);
            });
        });
        Promise.all(readers).then(sessions => {
            setImageQueue(prev => [...prev, ...sessions]);
            if (imageQueue.length === 0) setCurrentIndex(0);
            });
        }
    };

    const handleDeleteCurrentImage = () => {
        if (imageQueue.length === 0) return;

        const newQueue = imageQueue.filter((_, idx) => idx !== currentIndex);

        if (newQueue.length === 0) {
            setImageQueue([]);
            setCurrentIndex(0);
            clearEditorSession();
            setFilters(DEFAULT_FILTERS);
            setRotation(0);
            setIsFlippedH(false);
            setIsFlippedV(false);
            setAspectRatio('free');
            setCropBox({ x: 0, y: 0, width: 100, height: 100 });
            if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
            setImageQueue(newQueue);
            if (currentIndex >= newQueue.length) setCurrentIndex(newQueue.length - 1);
        }
    };

    useEffect(() => {
        if (aspectRatio === 'free') return;
        const [w, h] = aspectRatio.split(':').map(Number);
        const ratio = w / h;
        setCropBox(prev => {
            if (!imageRef.current) return prev;
            const imgRatio = imageRef.current.naturalWidth / imageRef.current.naturalHeight;
            const newHeight = (prev.width * imgRatio) / ratio;
            return { ...prev, height: Math.min(newHeight, 100 - prev.y) };
        });
    }, [aspectRatio, activeSession?.url]);

    const handleFilterChange = (key: keyof FilterState, value: number) => setFilters(prev => ({ ...prev, [key]: value }));
    const rotate90 = () => setRotation(prev => (prev + 90) % 360);

    const processSession = async (session: ImageSession): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                console.log('✅ Image loaded:', session.url.substring(0, 50));
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('❌ Cannot get canvas context');
                    return resolve('');
                }
                
                // Tính toán vùng crop từ % sang pixel
                const pixelX = (session.cropBox.x / 100) * img.naturalWidth;
                const pixelY = (session.cropBox.y / 100) * img.naturalHeight;
                const pixelW = (session.cropBox.width / 100) * img.naturalWidth;
                const pixelH = (session.cropBox.height / 100) * img.naturalHeight;
                
                console.log('🔍 Crop box:', { x: pixelX, y: pixelY, w: pixelW, h: pixelH });
                console.log('🔍 Original size:', { w: img.naturalWidth, h: img.naturalHeight });
                
                // Set canvas size bằng vùng crop
                canvas.width = pixelW;
                canvas.height = pixelH;
                
                // Di chuyển origin về giữa canvas
                ctx.translate(canvas.width / 2, canvas.height / 2);
                
                // Áp dụng rotation
                ctx.rotate((session.rotation * Math.PI) / 180);
                
                // Áp dụng flip
                ctx.scale(session.isFlippedH ? -1 : 1, session.isFlippedV ? -1 : 1);
                
                // Áp dụng filter
                ctx.filter = `brightness(${session.filters.brightness}%) contrast(${session.filters.contrast}%) saturate(${session.filters.saturate}%) sepia(${session.filters.sepia}%) grayscale(${session.filters.grayscale}%) hue-rotate(${session.filters.hueRotate}deg) blur(${session.filters.blur}px)`;
                
                // Vẽ ảnh: Lấy vùng crop từ ảnh gốc, vẽ vào canvas
                ctx.drawImage(
                    img,
                    pixelX, pixelY, pixelW, pixelH,  // Source: vùng crop trong ảnh gốc
                    -pixelW / 2, -pixelH / 2, pixelW, pixelH  // Destination: vẽ từ center
                );
                
                const result = canvas.toDataURL('image/jpeg', 0.92);
                console.log('✅ Canvas processed, result length:', result.length);
                resolve(result);
            };
            
            img.onerror = (e) => {
                console.error('❌ Image load error:', session.url, e);
                resolve(''); // Return empty thay vì reject
            };
            
            img.crossOrigin = 'anonymous';
            const imageSrc = session.url.startsWith('data:') ? session.url : getMediaUrl(session.url);
            console.log('🔍 Loading image from:', imageSrc.substring(0, 80));
            img.src = imageSrc;
        });
    };

    const saveBatchToLibrary = async () => {
        if (imageQueue.length === 0) return;
        if (!batchName.trim()) { alert('Please enter a Batch Name.'); return; }
        
        // ✅ FORCE SYNC trước khi save để đảm bảo configuration hiện tại được áp dụng
        const updatedQueue = imageQueue.map((session, idx) => {
            if (idx === currentIndex) {
                return { ...session, filters, aspectRatio, rotation, isFlippedH, isFlippedV, cropBox, zoom };
            }
            return session;
        });
        
        console.log('🔍 Updated queue before processing:', updatedQueue.map(s => ({
            name: s.name,
            cropBox: s.cropBox,
            rotation: s.rotation,
            filters: s.filters,
            urlLength: s.url.length
        })));
        
        // Hiển thị trạng thái Wait trong 3s
        setIsWaiting(true);
        await new Promise(resolve => setTimeout(resolve, 3000));
        setIsWaiting(false);
        
        setIsProcessing(true);
        try {
            const editedImages: { type: 'image' | 'video'; url: string }[] = [];
            
            console.log('🔄 Starting to process', updatedQueue.length, 'images...');
            
            for (let i = 0; i < updatedQueue.length; i++) {
                console.log(`🔄 Processing image ${i + 1}/${updatedQueue.length}`);
                const dataUrl = await processSession(updatedQueue[i]);
                console.log(`✅ Processed image ${i + 1}, result length:`, dataUrl.length);
                if (dataUrl) {
                    editedImages.push({
                        type: 'image',
                        url: dataUrl
                    });
                }
            }
            
            console.log('✅ All images processed:', editedImages.length);
            
            // Chuẩn bị items để lưu vào Media Library (dùng chung cho cả 2 trường hợp)
            const processedItems: MediaLibraryItem[] = editedImages.map((img, i) => {
                // Tính size chính xác từ base64
                const base64Length = img.url.length - (img.url.indexOf(',') + 1);
                const padding = (img.url.charAt(img.url.length - 2) === '=') ? 2 : ((img.url.charAt(img.url.length - 1) === '=') ? 1 : 0);
                const fileSize = (base64Length * 0.75) - padding;
                
                return {
                    id: `edited-${Date.now()}-${i}`,
                    name: `${batchName.trim()}_${String(i + 1).padStart(2, '0')}.jpg`,
                    type: 'image',
                    url: img.url,
                    size: Math.round(fileSize),
                    createdAt: new Date().toISOString(),
                    batchName: batchName.trim()
                };
            });
            
            // Xóa ảnh cũ trong IndexedDB trước khi save ảnh mới
            const allItems = await getAllMediaItems();
            console.log('📦 All items in library:', allItems.length);
            const itemsToDelete = allItems.filter(item => item.batchName === batchName.trim());
            console.log('🗑️ Items to delete with batchName', batchName.trim() + ':', itemsToDelete.length);
            
            for (const item of itemsToDelete) {
                console.log('🗑️ Deleting item:', item.id, item.name);
                await deleteMediaItem(item.id);
            }
            
            console.log('💾 Saving new items to Media Library:', processedItems.length);
            // Save ảnh mới vào Media Library
            await addMediaItems(processedItems);
            console.log('✅ Save to Media Library complete!');
            
            // Kiểm tra xem có phải từ Content Management không
            const sourcePostId = localStorage.getItem('editor-source-post-id');
            
            if (sourcePostId && sourcePostId !== '') {
                // Return ảnh về Content Management
                console.log('📤 Returning images to Content Management post:', sourcePostId);
                
                // Lưu vào localStorage để Content Management đọc sau khi navigate
                localStorage.setItem('pending-media-update', JSON.stringify({
                    postId: parseInt(sourcePostId),
                    media: editedImages
                }));
                
                // Chỉ clear sourcePostId, GIỮ LẠI session để user có thể tiếp tục edit
                localStorage.removeItem('editor-source-post-id');
                localStorage.removeItem('editor-batch-name');
                
                // Quay về Content Management (không cần update imageQueue vì sẽ navigate đi)
                window.dispatchEvent(new CustomEvent('navigate-to-content'));
            } else {
                // Chỉ từ Media Library - update imageQueue với URL mới
                const updatedImageQueue = imageQueue.map((session, idx) => {
                    if (editedImages[idx]) {
                        return { ...session, url: editedImages[idx].url };
                    }
                    return session;
                });
                setImageQueue(updatedImageQueue);
                
                // Reload Media Library để cập nhật
                window.dispatchEvent(new CustomEvent('reload-media-library'));
            }
        } catch (e) { 
            console.error('Save error:', e);
            alert("Error saving batch."); 
        } finally { 
            setIsProcessing(false); 
        }
    };

    const downloadImage = async () => {
        if (!activeSession) return;
        const dataUrl = await processSession(activeSession);
        const link = document.createElement('a');
        link.download = batchName.trim() ? `${batchName.trim()}_${currentIndex + 1}.png` : `edited_${Date.now()}.png`;
        link.href = dataUrl; link.click();
    };

    const handleMouseDown = (e: React.MouseEvent, handle: string | null = null) => {
        setIsDragging(true); setResizeHandle(handle); setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !imageRef.current) return;
        const img = imageRef.current;
        const zoomScale = zoom / 100;
        const dx = ((e.clientX - dragStart.x) / zoomScale / img.naturalWidth) * 100;
        const dy = ((e.clientY - dragStart.y) / zoomScale / img.naturalHeight) * 100;

        setCropBox(prev => {
            let { x, y, width, height } = prev;
            const imgRatio = img.naturalWidth / img.naturalHeight;
            if (resizeHandle) {
                if (resizeHandle.includes('n')) { y += dy; height -= dy; }
                if (resizeHandle.includes('s')) { height += dy; }
                if (resizeHandle.includes('w')) { x += dx; width -= dx; }
                if (resizeHandle.includes('e')) { width += dx; }
                if (e.shiftKey) {
                    const targetHeight = width * imgRatio;
                    if (resizeHandle.includes('n')) y -= (targetHeight - height);
                    height = targetHeight;
                }
            } else { x += dx; y += dy; }
            x = Math.max(0, Math.min(x, 100 - width)); y = Math.max(0, Math.min(y, 100 - height));
            width = Math.max(1, Math.min(width, 100 - x)); height = Math.max(1, Math.min(height, 100 - y));
            return { x, y, width, height };
        });
        setDragStart({ x: e.clientX, y: e.clientY });
    }, [isDragging, dragStart, zoom, resizeHandle]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', () => setIsDragging(false));
        }
        return () => { window.removeEventListener('mousemove', handleMouseMove); };
    }, [isDragging, handleMouseMove]);

    const filterString = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) sepia(${filters.sepia}%) grayscale(${filters.grayscale}%) hue-rotate(${filters.hueRotate}deg) blur(${filters.blur}px)`;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
            
            <EditorHeader 
                title="Image Editor" imageCount={imageQueue.length} currentIndex={currentIndex}
                onImport={() => fileInputRef.current?.click()}
                onDelete={handleDeleteCurrentImage} onSaveBatch={saveBatchToLibrary} onExport={downloadImage}
                isProcessing={isProcessing} isWaiting={isWaiting} isSyncing={isSyncing} hasActiveSession={!!activeSession}
            />

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
                <EditorWorkspace 
                    activeSession={activeSession} imageCount={imageQueue.length} currentIndex={currentIndex}
                    zoom={zoom} setZoom={setZoom} cropBox={cropBox} rotation={rotation}
                    isFlippedH={isFlippedH} isFlippedV={isFlippedV} filterString={filterString}
                    onPrev={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                    onNext={() => currentIndex < imageQueue.length - 1 && setCurrentIndex(currentIndex + 1)}
                    onFit={calculateInitialFit} onMouseDown={handleMouseDown} workspaceRef={workspaceRef}
                    imageRef={imageRef} onImportClick={() => fileInputRef.current?.click()}
                />

                <EditorSidebar 
                    aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} onRotate={rotate90}
                    isFlippedH={isFlippedH} setIsFlippedH={setIsFlippedH} isFlippedV={isFlippedV} setIsFlippedV={setIsFlippedV}
                    filters={filters} onFilterChange={handleFilterChange} onResetFilters={() => setFilters(DEFAULT_FILTERS)}
                    batchName={batchName} setBatchName={setBatchName} imageCount={imageQueue.length}
                />
            </div>
        </div>
    );
};

export default ImageEditor;
