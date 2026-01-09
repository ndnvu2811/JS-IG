
import React from 'react';
import { ImageSession, CropBox } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';
import { getMediaUrl } from '../../utils/mediaUtils';

interface EditorWorkspaceProps {
    activeSession: ImageSession | null;
    imageCount: number;
    currentIndex: number;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    cropBox: CropBox;
    rotation: number;
    isFlippedH: boolean;
    isFlippedV: boolean;
    filterString: string;
    onPrev: () => void;
    onNext: () => void;
    onFit: () => void;
    onMouseDown: (e: React.MouseEvent, handle?: string | null) => void;
    workspaceRef: React.RefObject<HTMLDivElement>;
    imageRef: React.RefObject<HTMLImageElement>;
    onImportClick: () => void;
}

const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
    activeSession, imageCount, currentIndex, zoom, setZoom, cropBox, rotation,
    isFlippedH, isFlippedV, filterString, onPrev, onNext, onFit, onMouseDown,
    workspaceRef, imageRef, onImportClick
}) => {
    return (
        <div 
            ref={workspaceRef}
            className="lg:basis-[70%] flex-1 bg-[#f8f9fa] dark:bg-background-dark/50 rounded-2xl border border-gray-200 dark:border-border-dark overflow-hidden relative shadow-inner flex items-center justify-center min-h-0 group"
        >
            {!activeSession ? (
                <div 
                    onClick={onImportClick}
                    className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl cursor-pointer hover:border-instagram-purple hover:bg-white/5 transition-all group"
                >
                    <div className="w-20 h-20 rounded-2xl bg-instagram-purple/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <MaterialSymbol icon="collections" className="text-5xl text-instagram-purple" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Batch Import</h3>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Select images to start batch editing</p>
                </div>
            ) : (
                <>
                    {imageCount > 1 && (
                        <>
                            <button 
                                onClick={onPrev} 
                                disabled={currentIndex === 0}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-40 size-12 flex items-center justify-center rounded-full bg-transparent border border-white/50 text-white backdrop-blur-sm transition-all disabled:opacity-0 disabled:pointer-events-none hover:bg-white/10 group/nav"
                            >
                                <MaterialSymbol icon="chevron_left" className="text-4xl group-hover/nav:-translate-x-1 transition-transform" />
                            </button>
                            <button 
                                onClick={onNext} 
                                disabled={currentIndex === imageCount - 1}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-40 size-12 flex items-center justify-center rounded-full bg-transparent border border-white/50 text-white backdrop-blur-sm transition-all disabled:opacity-0 disabled:pointer-events-none hover:bg-white/10 group/nav"
                            >
                                <MaterialSymbol icon="chevron_right" className="text-4xl group-hover/nav:translate-x-1 transition-transform" />
                            </button>
                        </>
                    )}

                    <div
                        className="relative flex items-center justify-center transition-transform duration-300 max-w-full max-h-full"
                        style={{ 
                            width: imageRef.current ? imageRef.current.naturalWidth * (zoom / 100) : 'auto',
                            height: imageRef.current ? imageRef.current.naturalHeight * (zoom / 100) : 'auto',
                            maxWidth: '100%',
                            maxHeight: '100%',
                        }}
                    >
                        <img 
                            ref={imageRef} src={getMediaUrl(activeSession.url)} alt="Editing canvas"
                            className="block w-full h-full select-none pointer-events-none rounded-sm shadow-2xl"
                            style={{ 
                                filter: filterString, 
                                transform: `rotate(${rotation}deg) scale(${isFlippedH ? -1 : 1}, ${isFlippedV ? -1 : 1})`
                            }}
                        />
                        <div className="absolute inset-0 pointer-events-none z-10">
                            <div className="absolute inset-0 bg-black/60" style={{ 
                                clipPath: `polygon(0% 0%, 0% 100%, ${cropBox.x}% 100%, ${cropBox.x}% ${cropBox.y}%, ${cropBox.x + cropBox.width}% ${cropBox.y}%, ${cropBox.x + cropBox.width}% ${cropBox.y + cropBox.height}%, ${cropBox.x}% ${cropBox.y + cropBox.height}%, ${cropBox.x}% 100%, 100% 100%, 100% 0%)` 
                            }}></div>
                            <div 
                                className="absolute pointer-events-auto border border-white/50 shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_0_20px_rgba(0,0,0,0.2)] cursor-move"
                                style={{ left: `${cropBox.x}%`, top: `${cropBox.y}%`, width: `${cropBox.width}%`, height: `${cropBox.height}%` }}
                                onMouseDown={(e) => onMouseDown(e)}
                            >
                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
                                    <div className="border-r border-white border-b"></div><div className="border-r border-white border-b"></div><div className="border-b border-white"></div>
                                    <div className="border-r border-white border-b"></div><div className="border-r border-white border-b"></div><div className="border-b border-white"></div>
                                </div>
                                {/* Dimension Display */}
                                {imageRef.current && (
                                    <div className="absolute -top-8 -left-0 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20 pointer-events-none">
                                        <p className="text-xs font-mono font-bold text-white whitespace-nowrap">
                                            {Math.round((cropBox.width / 100) * imageRef.current.naturalWidth)} × {Math.round((cropBox.height / 100) * imageRef.current.naturalHeight)}
                                        </p>
                                    </div>
                                )}
                                {['nw', 'ne', 'sw', 'se'].map(h => (
                                    <div key={h} className={`absolute bg-white size-3 border-2 border-instagram-purple pointer-events-auto shadow-lg ${h === 'nw' ? '-top-1.5 -left-1.5 cursor-nw-resize rounded-full' : h === 'ne' ? '-top-1.5 -right-1.5 cursor-ne-resize rounded-full' : h === 'sw' ? '-bottom-1.5 -left-1.5 cursor-sw-resize rounded-full' : '-bottom-1.5 -right-1.5 cursor-se-resize rounded-full'}`} onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, h); }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {imageCount > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50">
                    <div className="flex items-center">
                        <button onClick={onPrev} disabled={currentIndex === 0} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors disabled:opacity-20"><MaterialSymbol icon="chevron_left" className="text-2xl" /></button>
                        <div className="px-4 text-center min-w-[80px]"><p className="text-sm font-bold text-white leading-none">{currentIndex + 1} / {imageCount}</p></div>
                        <button onClick={onNext} disabled={currentIndex === imageCount - 1} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors disabled:opacity-20"><MaterialSymbol icon="chevron_right" className="text-2xl" /></button>
                    </div>
                    <div className="w-px h-8 bg-white/20 mx-2"></div>
                    <div className="flex items-center">
                        <button onClick={() => setZoom(z => Math.max(5, z - 5))} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"><MaterialSymbol icon="remove_circle" className="text-xl" /></button>
                        <div className="px-4 text-center min-w-[70px]"><p className="text-sm font-mono font-bold text-white leading-none">{zoom}%</p></div>
                        <button onClick={() => setZoom(z => Math.min(500, z + 5))} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"><MaterialSymbol icon="add" className="text-xl" /></button>
                        <div className="w-px h-8 bg-white/20 mx-2"></div>
                        <button onClick={onFit} title="Fit screen" className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"><MaterialSymbol icon="fullscreen_exit" className="text-xl" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditorWorkspace;
