import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MediaLibraryItem } from '../types';
import MaterialSymbol from '../components/icons/MaterialSymbol';
import MediaPreviewModal from '../components/content-management/MediaPreviewModal';
import {
  getAllMediaItems,
  addMediaItems,
  deleteMediaItem,
  deleteMultipleMediaItems,
  setEditorImagesFromContent,
  countFileReferences,
} from '../utils/library.ts';
import { deleteMediaFile } from '../utils/mediaUtils';
import LibraryHeader from '../components/media-library/LibraryHeader';
import LibraryToolbar from '../components/media-library/LibraryToolbar';
import LibraryGrid from '../components/media-library/LibraryGrid';

const MediaLibrary: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<MediaLibraryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getAllMediaItems();
      setMediaItems(items);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
    
    // Listen for reload event from Image Editor
    const handleReload = () => {
      loadMedia();
    };
    
    window.addEventListener('reload-media-library', handleReload);
    return () => {
      window.removeEventListener('reload-media-library', handleReload);
    };
  }, [loadMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems = await Promise.all(
      Array.from(files).map(
        (file: File) =>
          new Promise<MediaLibraryItem>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) =>
              resolve({
                id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type.startsWith('video') ? 'video' : 'image',
                url: event.target?.result as string,
                size: file.size,
                createdAt: new Date().toISOString(),
              });
            reader.readAsDataURL(file);
          })
      )
    );

    await addMediaItems(newItems);
    setMediaItems((prev) => [...newItems, ...prev]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleItemDelete = async (id: string) => {
    // Find the item to get its file path
    const itemToDelete = mediaItems.find((i) => i.id === id);
    
    if (!itemToDelete) return;
    
    // ✅ NEW: Check if file is referenced elsewhere before deleting
    const fileUrl = itemToDelete.url;
    let canDeleteFile = true;
    
    if (fileUrl && !fileUrl.startsWith('data:') && !fileUrl.startsWith('http')) {
      const refCount = await countFileReferences(fileUrl);
      
      if (refCount > 1) {
        // File is still used by other items
        console.log(`⚠️ File has ${refCount} references, keeping physical file`);
        setNotification({
          type: 'error',
          message: `Cannot delete: File is still used by ${refCount - 1} other item(s). Remove those items first.`,
        });
        // Still delete from IndexedDB, but don't delete the physical file
        canDeleteFile = false;
      } else {
        console.log(`✅ File has only 1 reference, safe to delete physical file`);
        canDeleteFile = true;
      }
    }
    
    // Delete from database
    await deleteMediaItem(id);
    
    // Delete actual file ONLY if it's safe and is a file path
    if (canDeleteFile && itemToDelete && itemToDelete.url && !itemToDelete.url.startsWith('data:')) {
      await deleteMediaFile(itemToDelete.url);
      setNotification({
        type: 'success',
        message: 'Media and file deleted successfully',
      });
    }
    
    setMediaItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  // Bổ sung hàm đang được gọi trong LibraryGrid nhưng thiếu định nghĩa trong file gốc
  const handleFolderDelete = async (folderName: string) => {
    const folderItems = mediaItems.filter((i) => i.batchName === folderName);
    const itemsToDelete = folderItems.map((i) => i.id);

    if (itemsToDelete.length > 0) {
      // ✅ NEW: Check references for each file before deleting
      const filesWithReferences: { url: string; refCount: number }[] = [];
      
      for (const item of folderItems) {
        if (item.url && !item.url.startsWith('data:') && !item.url.startsWith('http')) {
          const refCount = await countFileReferences(item.url);
          filesWithReferences.push({ url: item.url, refCount });
        }
      }
      
      // Check if any files have external references
      const filesWithExternalRefs = filesWithReferences.filter(f => f.refCount > 1);
      
      if (filesWithExternalRefs.length > 0) {
        setNotification({
          type: 'error',
          message: `Cannot delete folder: ${filesWithExternalRefs.length} file(s) are still in use by other items`,
        });
        return;
      }
      
      // Delete from database
      await deleteMultipleMediaItems(itemsToDelete);
      
      // Delete actual files (safe because no external references)
      for (const item of folderItems) {
        if (item.url && !item.url.startsWith('data:') && !item.url.startsWith('http')) {
          await deleteMediaFile(item.url);
        }
      }
      
      setNotification({
        type: 'success',
        message: `Folder "${folderName}" and ${folderItems.length} file(s) deleted successfully`,
      });
    }

    setMediaItems((prev) => prev.filter((i) => i.batchName !== folderName));

    setSelectedIds((prev) => {
      const n = new Set(prev);
      // remove folder id
      n.delete(`folder_${folderName}`);
      // remove all items in that folder
      itemsToDelete.forEach((id) => n.delete(id));
      return n;
    });

    if (selectedFolder === folderName) setSelectedFolder(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const itemsToDelete: string[] = [];
    const foldersToDelete: string[] = [];
    const itemsToDeleteObjects: MediaLibraryItem[] = [];

    // Separate folders and items
    selectedIds.forEach((id) => {
      if (id.startsWith('folder_')) {
        const folderName = id.replace('folder_', '');
        foldersToDelete.push(folderName);
      } else {
        itemsToDelete.push(id);
        const item = mediaItems.find((i) => i.id === id);
        if (item) itemsToDeleteObjects.push(item);
      }
    });

    // Collect all items from selected folders
    foldersToDelete.forEach((folderName) => {
      const folderItems = mediaItems.filter((i) => i.batchName === folderName);
      itemsToDelete.push(...folderItems.map((i) => i.id));
      itemsToDeleteObjects.push(...folderItems);
    });

    // Delete all items from database
    if (itemsToDelete.length > 0) {
      await deleteMultipleMediaItems(itemsToDelete);
      
      // Delete actual files
      for (const item of itemsToDeleteObjects) {
        if (item.url && !item.url.startsWith('data:')) {
          await deleteMediaFile(item.url);
        }
      }
    }

    setMediaItems((prev) => prev.filter((i) => !itemsToDelete.includes(i.id)));
    setSelectedIds(new Set());

    console.log(
      `✅ Deleted ${foldersToDelete.length} folder(s) and ${itemsToDelete.length} item(s)`
    );
  };

  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [mediaItems, filterType, searchQuery]);

  const { folders, items } = useMemo(() => {
    if (selectedFolder) {
      return {
        folders: [],
        items: filteredItems.filter((i) => i.batchName === selectedFolder),
      };
    }

    const fMap = new Map<string, any>();
    const loose: MediaLibraryItem[] = [];

    filteredItems.forEach((i) => {
      if (i.batchName) {
        if (!fMap.has(i.batchName)) {
          fMap.set(i.batchName, { name: i.batchName, count: 0, previewUrl: i.url });
        }
        fMap.get(i.batchName)!.count++;
      } else {
        loose.push(i);
      }
    });

    // Sort folders by number in name (e.g., Down_Image_555, Down_Image_556)
    const sortedFolders = Array.from(fMap.values()).sort((a, b) => {
      // Extract numbers from folder names
      const numA = parseInt(a.name.match(/\d+$/)?.[0] || '0');
      const numB = parseInt(b.name.match(/\d+$/)?.[0] || '0');
      return numA - numB;
    });

    return { folders: sortedFolders, items: loose };
  }, [filteredItems, selectedFolder]);

  const handleQuickFix = async (folderName: string) => {
    // Lấy tất cả media trong folder
    const folderItems = mediaItems.filter(item => item.batchName === folderName);
    
    if (folderItems.length === 0) return;
    
    // Lọc chỉ lấy ảnh (không lấy video)
    const imageUrls = folderItems
      .filter(m => m.type === 'image')
      .map(m => m.url);
    
    if (imageUrls.length === 0) {
      alert('No images to edit. Only images can be edited in Image Editor.');
      return;
    }
    
    // Đặt ảnh vào Editor Session
    await setEditorImagesFromContent(imageUrls);
    
    // Lưu batch name để sau khi edit xong có thể cập nhật lại
    localStorage.setItem('editor-batch-name', folderName);
    localStorage.setItem('editor-source-post-id', ''); // Clear post ID
    localStorage.setItem('editor-last-index', '0');
    
    // ✅ Chuyển sang trang Image Editor bằng CustomEvent
    window.dispatchEvent(new CustomEvent('navigate-to-image-editor'));
  };

  const handleItemQuickFix = async (imageUrl: string) => {
    // Đặt ảnh vào Editor Session
    await setEditorImagesFromContent([imageUrl]);
    
    // Clear batch name vì đây là single item
    localStorage.setItem('editor-batch-name', '');
    localStorage.setItem('editor-source-post-id', '');
    localStorage.setItem('editor-last-index', '0');
    
    // Chuyển sang trang Image Editor
    window.dispatchEvent(new CustomEvent('navigate-to-image-editor'));
  };

  const handleItemQuickEdit = async (videoUrl: string) => {
    // Lưu video vào localStorage
    localStorage.setItem('edit-reel-video-url', videoUrl);
    localStorage.setItem('edit-reel-source', 'media-library');
    localStorage.setItem('edit-reel-folder', '');
    
    // Chuyển sang trang Edit Reel
    window.dispatchEvent(new CustomEvent('navigate-to-edit-reel'));
  };

  const handleQuickEdit = async (folderName: string) => {
    // Lấy tất cả media trong folder
    const folderItems = mediaItems.filter(item => item.batchName === folderName);
    
    if (folderItems.length === 0) return;
    
    // Lọc chỉ lấy video
    const videoItems = folderItems.filter(m => m.type === 'video');
    
    if (videoItems.length === 0) {
      setNotification({
        type: 'error',
        message: 'No videos to edit. Only videos can be edited in Reel Editor.'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Lấy video đầu tiên để edit
    const videoUrl = videoItems[0].url;
    
    // Lưu vào localStorage để EditReel page có thể load
    localStorage.setItem('edit-reel-video-url', videoUrl);
    localStorage.setItem('edit-reel-source', 'media-library');
    localStorage.setItem('edit-reel-folder', folderName);
    
    // Chuyển sang trang Edit Reel
    window.dispatchEvent(new CustomEvent('navigate-to-edit-reel'));
  };

  const handleFolderDownload = async (folderName: string) => {
    // Lấy tất cả media trong folder
    const folderItems = mediaItems.filter(item => item.batchName === folderName);
    
    if (folderItems.length === 0) {
      alert('No media found in this folder.');
      return;
    }

    if (!window.electronAPI?.copyFileToDownloads) {
      alert('Download feature is not available.');
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
      const downloadFolderName = `${folderName}_${timestamp}`;
      
      let successCount = 0;
      let failCount = 0;

      // Download từng file
      for (let i = 0; i < folderItems.length; i++) {
        const item = folderItems[i];
        try {
          // Lấy source path từ URL
          let sourcePath = item.url;
          
          // Convert media-file:// về đường dẫn thực
          if (sourcePath.startsWith('media-file://')) {
            sourcePath = sourcePath.replace('media-file://', '');
            // Xử lý path Windows
            if (!sourcePath.match(/^[A-Z]:/i)) {
              sourcePath = sourcePath.replace(/^\/+/, '');
            }
          }

          // Copy file sang Downloads
          const result = await window.electronAPI.copyFileToDownloads({ 
            sourcePath, 
            fileName: item.name,
            folderName: downloadFolderName
          });
          
          if (result.success) {
            successCount++;
            console.log(`✅ Copied to Downloads: ${item.name}`);
          } else {
            failCount++;
            console.error(`❌ Failed to copy ${item.name}:`, result.error);
          }
          
          // Delay nhỏ
          if (i < folderItems.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          failCount++;
          console.error(`Failed to copy ${item.name}:`, error);
        }
      }

      if (successCount > 0) {
        setNotification({
          type: 'success',
          message: `Successfully downloaded ${successCount}/${folderItems.length} file(s) to Downloads/${downloadFolderName}`
        });
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({
          type: 'error',
          message: `Failed to download files. Error: ${failCount} files failed.`
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Download error:', error);
      setNotification({
        type: 'error',
        message: 'An error occurred during download.'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <LibraryHeader
        title={selectedFolder ? `Folder: ${selectedFolder}` : 'Media Library'}
        description={selectedFolder ? `${items.length} items in batch` : 'Manage your visual content'}
        selectedCount={selectedIds.size}
        onDeleteSelected={handleBulkDelete}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      {/* Notification */}
      {notification && (
        <div className={`mx-6 mb-4 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          <MaterialSymbol icon={notification.type === 'success' ? 'check_circle' : 'error'} className="text-xl" />
          <span className="text-sm flex-1">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="hover:opacity-70">
            <MaterialSymbol icon="close" className="text-lg" />
          </button>
        </div>
      )}

      <LibraryToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        isFolderView={!!selectedFolder}
        isAllSelected={
          folders.length + items.length > 0 &&
          selectedIds.size === folders.length + items.length
        }
        onSelectAllChange={() => {
          if (selectedIds.size === folders.length + items.length) {
            setSelectedIds(new Set());
          } else {
            const allIds = new Set([
              ...folders.map((f) => `folder_${f.name}`),
              ...items.map((i) => i.id),
            ]);
            setSelectedIds(allIds);
          }
        }}
      />

      {/* FIX: sửa JSX bị thiếu dấu / sai cú pháp ở file gốc */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <MaterialSymbol icon="sync" className="text-4xl text-instagram-purple animate-spin" />
          </div>
        ) : filteredItems.length > 0 ? (
          <LibraryGrid
            folders={folders}
            items={items}
            selectedIds={selectedIds}
            toggleSelect={(id) =>
              setSelectedIds((prev) => {
                const n = new Set(prev);
                n.has(id) ? n.delete(id) : n.add(id);
                return n;
              })
            }
            onFolderClick={setSelectedFolder}
            onItemPreview={setPreviewItem}
            onItemDelete={handleItemDelete}
            onFolderDelete={handleFolderDelete}
            onQuickFix={handleQuickFix}
            onQuickEdit={handleQuickEdit}
            onItemQuickFix={handleItemQuickFix}
            onItemQuickEdit={handleItemQuickEdit}
            onFolderDownload={handleFolderDownload}
            allMediaItems={mediaItems}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-60">
            <MaterialSymbol icon="perm_media" className="text-6xl text-gray-400 mb-4" />
            <h3 className="text-xl font-bold dark:text-white">No media found</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 text-instagram-purple font-bold hover:underline"
            >
              Add your first file
            </button>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*"
        multiple
      />

      {selectedFolder && (
        <button
          onClick={() => setSelectedFolder(null)}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform z-40"
        >
          <MaterialSymbol icon="chevron_left" className="text-2xl text-instagram-purple" />
        </button>
      )}

      {previewItem && (
        <MediaPreviewModal
          media={{ type: previewItem.type, url: previewItem.url }}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
};

export default MediaLibrary;
