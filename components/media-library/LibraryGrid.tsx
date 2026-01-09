import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';
import { MediaLibraryItem } from '../../types';
import { getMediaUrl } from '../../utils/mediaUtils';

interface FolderData {
  name: string;
  count: number;
  previewUrl: string;
}

interface LibraryGridProps {
  folders: FolderData[];
  items: MediaLibraryItem[];
  selectedIds: Set<string>;
  toggleSelect: (id: string, e?: React.MouseEvent) => void;
  onFolderClick: (name: string) => void;
  onItemPreview: (item: MediaLibraryItem) => void;
  onItemDelete: (id: string) => void;
  onFolderDelete?: (folderName: string) => void;
  onQuickFix?: (folderName: string) => void;
  onQuickEdit?: (folderName: string) => void;
  onItemQuickFix?: (itemUrl: string) => void;
  onItemQuickEdit?: (itemUrl: string) => void;
  onFolderDownload?: (folderName: string) => void;
  allMediaItems?: MediaLibraryItem[];
}

const LibraryGrid: React.FC<LibraryGridProps> = ({ folders, items, selectedIds, toggleSelect, onFolderClick, onItemPreview, onItemDelete, onFolderDelete, onQuickFix, onQuickEdit, onItemQuickFix, onItemQuickEdit, onFolderDownload, allMediaItems }) => {
  console.log('🔍 LibraryGrid - folders:', folders.length, 'items:', items.length);
  console.log('🔍 LibraryGrid - onItemQuickFix:', !!onItemQuickFix, 'onItemQuickEdit:', !!onItemQuickEdit);
  if (items.length > 0) {
    console.log('🔍 First item:', items[0].name, items[0].type);
  }
  
  const formatSize = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleDownload = (item: MediaLibraryItem) => {
    const link = document.createElement('a');
    const href = item.url.startsWith('data:') ? item.url : getMediaUrl(item.url);
    link.href = href;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative z-30 mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-5 animate-in fade-in">
      {folders.map((folder) => {
        const folderId = `folder_${folder.name}`;
        const isSelected = selectedIds.has(folderId);
        
        // Xác định type của folder dựa trên items bên trong
        const folderItems = allMediaItems?.filter(item => item.batchName === folder.name) || [];
        const folderType = folderItems.length > 0 ? folderItems[0].type : 'image';
        
        return (
          <div key={folder.name} className={`group relative bg-white dark:bg-content-dark border rounded-[10px] overflow-hidden shadow-sm transition-all ${isSelected ? 'border-instagram-purple ring-2 ring-instagram-purple/30' : 'border-gray-200 dark:border-border-dark hover:shadow-xl hover:-translate-y-1'}`}>
            {/* Checkbox for folder selection */}
            <div className={`absolute top-2 left-2 z-20 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(folderId)}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded border-white bg-black/50 text-instagram-purple focus:ring-instagram-purple cursor-pointer shadow-lg"
              />
            </div>
            
            <div onClick={() => onFolderClick(folder.name)} className="aspect-square w-full relative bg-gray-100 dark:bg-gray-900 flex items-center justify-center cursor-pointer">
            <img src={getMediaUrl(folder.previewUrl)} className="absolute inset-0 w-full h-full object-cover blur-[2px] opacity-30 scale-110" alt="" />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-instagram-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MaterialSymbol icon="photo_library" className="text-4xl text-instagram-purple" />
              </div>
              <span className="px-3 py-1 rounded-full bg-instagram-purple text-white text-[10px] font-black uppercase tracking-widest shadow-lg">{folder.count} Items</span>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            {/* Row 1: Folder Name */}
            <div className="mb-2">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate capitalize">{folder.name.toLowerCase().replace(/_/g, ' ')}</p>
            </div>
            
            {/* Row 2: Action Buttons */}
            <div className="flex items-center gap-1 mb-2" onClick={(e) => e.stopPropagation()}>
              {/* Download Button */}
              {onFolderDownload && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onFolderDownload(folder.name); 
                  }} 
                  className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
                  title="Download all media in folder"
                >
                  <MaterialSymbol icon="download" className="text-sm leading-none" />
                </button>
              )}
              {/* Quick Fix Button - cho Image */}
              {onQuickFix && folderType === 'image' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickFix(folder.name);
                  }}
                  className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                  title="Edit images in Image Editor"
                >
                  <MaterialSymbol icon="auto_fix_high" className="text-sm leading-none" />
                </button>
              )}
              {/* Quick Edit Button - cho Video */}
              {onQuickEdit && folderType === 'video' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickEdit(folder.name);
                  }}
                  className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  title="Edit video in Reel Editor"
                >
                  <MaterialSymbol icon="edit_note" className="text-sm leading-none" />
                </button>
              )}
            </div>
            
            {/* Row 3: Metadata */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Batch Folder</p>
              <div className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[9px] font-bold uppercase tracking-wider">{folderType}</div>
            </div>
          </div>
        </div>
        );
      })}

      {items.map((item) => {
        const isSelected = selectedIds.has(item.id);
        const mediaSrc = item.url.startsWith('data:') ? item.url : getMediaUrl(item.url);

        return (
          <div key={item.id} className={`group relative bg-white dark:bg-content-dark border rounded-[10px] overflow-hidden shadow-sm transition-all ${isSelected ? 'border-instagram-purple ring-2 ring-instagram-purple/30' : 'border-gray-200 dark:border-border-dark hover:shadow-xl hover:-translate-y-1'}`}>
            <div className={`absolute top-2 left-2 z-20 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item.id)} className="w-5 h-5 rounded border-white bg-black/50 text-instagram-purple focus:ring-instagram-purple cursor-pointer shadow-lg" />
            </div>
            {/* ✅ Thumbnail ratio 1:1 */}
            <div className="aspect-[1/1] w-full relative bg-gray-100 dark:bg-gray-900 overflow-hidden cursor-pointer" onClick={() => onItemPreview(item)}>
              {item.type === 'image' ? (
                <img src={mediaSrc} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center relative">
                  <video
                    src={mediaSrc}
                    className="w-full h-full object-cover opacity-70"
                    preload="metadata"
                    muted
                    playsInline
                    onLoadedData={(e) => {
                      const v = e.target as HTMLVideoElement;
                      try { v.currentTime = 0.1; } catch {}
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MaterialSymbol icon="play_circle" className="text-4xl text-white drop-shadow-lg" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3">
              {/* Row 1: File Name */}
              <div className="mb-2">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate" title={item.name}>{item.name}</p>
              </div>
              
              {/* Row 2: Action Buttons */}
              <div className="flex items-center gap-1 mb-2">
                {/* Quick Fix Button - cho Image */}
                {onItemQuickFix && item.type === 'image' && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onItemQuickFix(item.url); 
                    }} 
                    className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors" 
                    title="Edit image in Image Editor"
                  >
                    <MaterialSymbol icon="auto_fix_high" className="text-sm leading-none" />
                  </button>
                )}
                {/* Quick Edit Button - cho Video */}
                {onItemQuickEdit && item.type === 'video' && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onItemQuickEdit(item.url); 
                    }} 
                    className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors" 
                    title="Edit video in Reel Editor"
                  >
                    <MaterialSymbol icon="edit_note" className="text-sm leading-none" />
                  </button>
                )}
                {/* Download Button */}
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleDownload(item); 
                  }} 
                  className="flex-1 h-7 flex items-center justify-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
                  title="Download"
                >
                  <MaterialSymbol icon="download" className="text-sm leading-none" />
                </button>
              </div>
              
              {/* Row 3: Metadata */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{formatSize(item.size)}</p>
                <div className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[9px] font-bold uppercase tracking-wider">{item.type}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LibraryGrid;
