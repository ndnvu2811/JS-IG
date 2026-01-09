import { MediaLibraryItem, ReelSession } from '../types';

const DB_NAME = 'InstagramToolCareDB';
const STORE_NAME = 'media-library';
const SESSION_STORE = 'editor-session'; 
const REEL_SESSION_STORE = 'reel-session';
const REEL_CONFIG_STORE = 'reel-config';
const DB_VERSION = 4;

// ✅ FIX: Track if DB is being opened to prevent concurrent opens
let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * ✅ FIX: Safe IndexedDB open with retry and error handling
 * Prevents "Internal error opening backing store" by:
 * 1. Reusing existing connection
 * 2. Handling concurrent open attempts
 * 3. Adding retry logic
 */
export const openDB = (): Promise<IDBDatabase> => {
    // Return existing connection if available and not closed
    if (dbInstance && dbInstance.objectStoreNames.length > 0) {
        try {
            // Test if connection is still valid
            dbInstance.transaction(STORE_NAME, 'readonly');
            return Promise.resolve(dbInstance);
        } catch {
            // Connection is stale, reset it
            dbInstance = null;
        }
    }

    // If already opening, return the existing promise
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        // ✅ FIX: Add timeout to prevent hanging
        const timeout = setTimeout(() => {
            dbPromise = null;
            reject(new Error('IndexedDB open timeout after 10 seconds'));
        }, 10000);

        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                
                // Create stores if they don't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(SESSION_STORE)) {
                    db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(REEL_SESSION_STORE)) {
                    db.createObjectStore(REEL_SESSION_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(REEL_CONFIG_STORE)) {
                    db.createObjectStore(REEL_CONFIG_STORE, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event: any) => {
                clearTimeout(timeout);
                dbInstance = event.target.result;
                
                // ✅ FIX: Handle connection close
                dbInstance!.onclose = () => {
                    console.log('📦 IndexedDB connection closed');
                    dbInstance = null;
                    dbPromise = null;
                };
                
                // ✅ FIX: Handle errors on the connection
                dbInstance!.onerror = (e: any) => {
                    console.error('📦 IndexedDB error:', e.target?.error);
                };

                dbPromise = null;
                resolve(dbInstance!);
            };

            request.onerror = (event: any) => {
                clearTimeout(timeout);
                dbPromise = null;
                const error = event.target?.error;
                console.error('📦 IndexedDB open error:', error);
                reject(error || new Error('Failed to open IndexedDB'));
            };

            request.onblocked = () => {
                clearTimeout(timeout);
                dbPromise = null;
                console.warn('📦 IndexedDB blocked - close other tabs using this database');
                reject(new Error('IndexedDB blocked - please close other tabs'));
            };
        } catch (error) {
            clearTimeout(timeout);
            dbPromise = null;
            reject(error);
        }
    });

    return dbPromise;
};

/**
 * ✅ FIX: Close database connection (call when app closes)
 */
export const closeDB = (): void => {
    if (dbInstance) {
        try {
            dbInstance.close();
        } catch (e) {
            console.error('Error closing IndexedDB:', e);
        }
        dbInstance = null;
        dbPromise = null;
    }
};

// ✅ NEW: Restore media library from backup (for persistence)
export const restoreMediaLibraryFromBackup = async (): Promise<void> => {
    try {
        console.log('📚 Attempting to restore media library from backup...');
        
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI?.loadMediaLibraryBackup) {
            console.warn('⚠️ loadMediaLibraryBackup not available');
            return;
        }
        
        const { success, items } = await electronAPI.loadMediaLibraryBackup();
        
        if (!success || !items || items.length === 0) {
            console.log('📚 No backup items to restore');
            return;
        }
        
        console.log(`📚 Restoring ${items.length} items from backup...`);
        await addMediaItems(items);
        console.log(`📚 ✅ Media library restored from backup`);
    } catch (error) {
        console.error('📚 Error restoring media library backup:', error);
    }
};

// ✅ NEW: Backup media library to file (for persistence)
export const backupMediaLibraryToFile = async (): Promise<void> => {
    try {
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI?.saveMediaLibraryBackup) {
            console.warn('⚠️ saveMediaLibraryBackup not available');
            return;
        }
        
        const items = await getAllMediaItems();
        if (items.length === 0) {
            console.log('📚 No items to backup');
            return;
        }
        
        console.log(`📚 Backing up ${items.length} media items...`);
        const result = await electronAPI.saveMediaLibraryBackup(items);
        
        if (result.success) {
            console.log(`📚 ✅ Media library backed up (${items.length} items)`);
        } else {
            console.error('📚 Failed to backup media library:', result.error);
        }
    } catch (error) {
        console.error('📚 Error backing up media library:', error);
    }
};

/**
 * ✅ FIX: Safe transaction wrapper with retry
 */
async function safeTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const db = await openDB();
            
            return await new Promise<T>((resolve, reject) => {
                try {
                    const transaction = db.transaction(storeName, mode);
                    const store = transaction.objectStore(storeName);
                    const request = operation(store);

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    
                    transaction.onerror = () => reject(transaction.error);
                } catch (e) {
                    reject(e);
                }
            });
        } catch (error: any) {
            lastError = error;
            console.warn(`📦 Transaction attempt ${attempt}/${maxRetries} failed:`, error.message);
            
            // Reset connection for retry
            dbInstance = null;
            dbPromise = null;
            
            if (attempt < maxRetries) {
                // Wait before retry
                await new Promise(r => setTimeout(r, 100 * attempt));
            }
        }
    }

    throw lastError || new Error('Transaction failed after retries');
}

// Media Library Functions
export const getAllMediaItems = async (): Promise<MediaLibraryItem[]> => {
    try {
        console.log('📦 Loading media items from IndexedDB...');
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result as MediaLibraryItem[];
                console.log(`📦 ✅ Loaded ${results.length} items from IndexedDB`);
                if (results.length > 0) {
                    results.forEach(item => {
                        console.log(`  - ${item.name} (${item.type})`);
                    });
                }
                resolve(results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            };
            request.onerror = () => {
                console.error('📦 ❌ Failed to load items:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('📦 getAllMediaItems error:', error);
        return []; // ✅ FIX: Return empty array instead of throwing
    }
};

export const addMediaItems = async (items: MediaLibraryItem[]): Promise<void> => {
    if (!items || items.length === 0) return;
    
    try {
        console.log(`📦 Adding ${items.length} items to MediaLibrary...`);
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // Add all items
            items.forEach((item, index) => {
                const req = store.put(item);
                req.onsuccess = () => {
                    console.log(`  ✅ Saved item ${index + 1}/${items.length}: ${item.name}`);
                };
                req.onerror = () => {
                    console.error(`  ❌ Failed to save item ${index + 1}/${items.length}: ${item.name}`, req.error);
                };
            });
            
            // Wait for transaction to complete
            transaction.oncomplete = () => {
                console.log(`📦 ✅ All ${items.length} items saved to IndexedDB`);
                resolve();
            };
            
            transaction.onerror = () => {
                console.error(`📦 ❌ Transaction error:`, transaction.error);
                reject(transaction.error);
            };
        });
    } catch (error) {
        console.error('📦 addMediaItems error:', error);
        // ✅ FIX: Don't throw, just log - allows app to continue
    }
};

export const deleteMediaItem = async (id: string): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('📦 deleteMediaItem error:', error);
    }
};

export const deleteMultipleMediaItems = async (ids: string[]): Promise<void> => {
    if (!ids || ids.length === 0) return;
    
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            ids.forEach(id => store.delete(id));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('📦 deleteMultipleMediaItems error:', error);
    }
};

/**
 * ✅ NEW: Count how many media library items reference a specific file URL
 * Used to determine if a file can be safely deleted
 * @param fileUrl The file path/URL to check references for
 * @returns Count of items using this file
 */
export const countFileReferences = async (fileUrl: string): Promise<number> => {
    try {
        console.log(`📦 Counting references for file: ${fileUrl}`);
        const allItems = await getAllMediaItems();
        
        // Count items that reference this file
        const referenceCount = allItems.filter(item => item.url === fileUrl).length;
        
        console.log(`📦 File "${fileUrl}" has ${referenceCount} reference(s)`);
        return referenceCount;
    } catch (error) {
        console.error('📦 countFileReferences error:', error);
        return 0;
    }
};

// Image Editor Session Functions
export const saveEditorSession = async (queue: any[]): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(SESSION_STORE);
            store.clear();
            queue.forEach((item, index) => {
                store.put({ ...item, id: `session-${index}`, order: index });
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('📦 saveEditorSession error:', error);
    }
};

export const getEditorSession = async (): Promise<any[]> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(SESSION_STORE, 'readonly');
            const store = transaction.objectStore(SESSION_STORE);
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result as any[];
                resolve(results.sort((a, b) => a.order - b.order));
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('📦 getEditorSession error:', error);
        return [];
    }
};

export const clearEditorSession = async (): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(SESSION_STORE);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('📦 clearEditorSession error:', error);
    }
};

// Reel Editor Session Functions (includes video)
export const saveReelSession = async (session: ReelSession): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(REEL_SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(REEL_SESSION_STORE);
            store.put({ ...session, id: 'current-reel-session' });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('📦 saveReelSession error:', error);
    }
};

export const getReelSession = async (): Promise<ReelSession | null> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(REEL_SESSION_STORE, 'readonly');
            const store = transaction.objectStore(REEL_SESSION_STORE);
            const request = store.get('current-reel-session');
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('📦 getReelSession error:', error);
        return null;
    }
};

export const clearReelSession = async (): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(REEL_SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(REEL_SESSION_STORE);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('📦 clearReelSession error:', error);
    }
};

// Reel Configuration Functions
export interface ReelConfig {
    texts: ReelSession['texts'];
    logos: ReelSession['logos'];
    videoScale: number;
    videoX: number;
    videoY: number;
    originalVolume: number;
    musicVolume: number;
    musicUrl: string | null;
}

export const saveReelConfig = async (config: ReelConfig): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(REEL_CONFIG_STORE, 'readwrite');
            const store = transaction.objectStore(REEL_CONFIG_STORE);
            store.put({ ...config, id: 'current-reel-config' });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('📦 saveReelConfig error:', error);
    }
};

export const getReelConfig = async (): Promise<ReelConfig | null> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(REEL_CONFIG_STORE, 'readonly');
            const store = transaction.objectStore(REEL_CONFIG_STORE);
            const request = store.get('current-reel-config');
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('📦 getReelConfig error:', error);
        return null;
    }
};

export const clearReelConfig = async (): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(REEL_CONFIG_STORE, 'readwrite');
            const store = transaction.objectStore(REEL_CONFIG_STORE);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('📦 clearReelConfig error:', error);
    }
};

export const getReelSessionWithConfig = async (): Promise<ReelSession | null> => {
    try {
        const session = await getReelSession();
        const config = await getReelConfig();
        
        if (!session && !config) return null;
        
        if (config) {
            return {
                videoUrl: session?.videoUrl || null,
                videoScale: config.videoScale,
                videoX: config.videoX,
                videoY: config.videoY,
                musicUrl: config.musicUrl,
                originalVolume: config.originalVolume,
                musicVolume: config.musicVolume,
                texts: config.texts,
                logos: config.logos
            };
        }
        
        return session;
    } catch (error) {
        console.error('📦 getReelSessionWithConfig error:', error);
        return null;
    }
};

// ============ SYNC MEDIA FUNCTIONS ============

/**
 * ✅ FIX: syncMediaToLibrary with better error handling
 */
export const syncMediaToLibrary = async (
    postId: number,
    mediaItems: Array<{ type: 'image' | 'video'; url: string }>,
    type: 'Post' | 'Reel' | 'Scraper',
    customBatchName?: string
): Promise<void> => {
    if (!mediaItems || mediaItems.length === 0) {
        console.log('📦 syncMediaToLibrary: No media items to sync');
        return;
    }

    const batchName = customBatchName || `${type}_${postId}`;

    try {
        console.log(`📦 🔄 Syncing ${mediaItems.length} items to library: ${batchName}`);
        
        const libraryItems: MediaLibraryItem[] = mediaItems.map((item, index) => {
            let ext = '';
            if (item.url) {
                const urlExt = item.url.split('?')[0].split('.').pop()?.toLowerCase();
                if (urlExt && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'].includes(urlExt)) {
                    ext = urlExt;
                }
            }
            if (!ext) {
                ext = item.type === 'video' ? 'mp4' : 'jpg';
            }
            
            const itemData = {
                id: `${batchName}-${index}-${Date.now()}`,
                name: `${batchName}_${String(index + 1).padStart(2, '0')}.${ext}`,
                type: item.type,
                url: item.url,
                size: 0,
                createdAt: new Date().toISOString(),
                batchName: batchName,
            };
            console.log(`  📄 Created item: ${itemData.name}`);
            return itemData;
        });

        await addMediaItems(libraryItems);
        console.log(`📦 ✅ Successfully synced ${libraryItems.length} items to library: ${batchName}`);
    } catch (error) {
        console.error('📦 syncMediaToLibrary error:', error);
        // ✅ FIX: Don't throw - allow download to continue even if library sync fails
    }
};

export const removeMediaFromLibrary = async (
    postId: number,
    type: 'Post' | 'Reel' | 'Scraper'
): Promise<void> => {
    try {
        const batchName = `${type}_${postId}`;
        const allItems = await getAllMediaItems();
        const itemsToDelete = allItems.filter(item => item.batchName === batchName);
        
        if (itemsToDelete.length > 0) {
            await deleteMultipleMediaItems(itemsToDelete.map(item => item.id));
        }
    } catch (error) {
        console.error('📦 removeMediaFromLibrary error:', error);
    }
};

export const getMediaByPostId = async (
    postId: number,
    type: 'Post' | 'Reel' | 'Scraper'
): Promise<MediaLibraryItem[]> => {
    try {
        const batchName = `${type}_${postId}`;
        const allItems = await getAllMediaItems();
        return allItems.filter(item => item.batchName === batchName);
    } catch (error) {
        console.error('📦 getMediaByPostId error:', error);
        return [];
    }
};

export const setEditorImagesFromContent = async (
    images: string[]
): Promise<void> => {
    if (!images || images.length === 0) return;
    
    try {
        const db = await openDB();
        
        const currentSession = await getEditorSession();
        const lastFilters = currentSession.length > 0 ? currentSession[0].filters : {
            brightness: 100, contrast: 100, saturate: 100, sepia: 0, grayscale: 0, hueRotate: 0, blur: 0
        };
        const lastAspectRatio = currentSession.length > 0 ? currentSession[0].aspectRatio : 'free';
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(SESSION_STORE);
            
            store.clear();
            
            images.forEach((url, index) => {
                store.put({
                    id: `session-${index}`,
                    order: index,
                    url: url,
                    name: `image_${index + 1}`,
                    filters: { ...lastFilters },
                    aspectRatio: lastAspectRatio,
                    rotation: 0,
                    isFlippedH: false,
                    isFlippedV: false,
                    cropBox: { x: 0, y: 0, width: 100, height: 100 },
                    zoom: 100
                });
            });
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('📦 setEditorImagesFromContent error:', error);
    }
};