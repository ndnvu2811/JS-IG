import { useEffect, useState } from 'react';
import { restoreMediaLibraryFromBackup, backupMediaLibraryToFile } from '../../utils/library';

const getElectronAPI = () => {
    return (window as any).electronAPI;
};

const KEYS_TO_BACKUP = [
    'instagram-accounts',
    'instagram-posts', 
    'instagram-reels',
    'instagram-proxies',
    'care-activity-schedules',
    'care-settings',
    'posts-history',
    'reels-history',
    'care-history'
];

export const useAppStorage = () => {
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // 💾 Load storage backup from Electron file khi app start
    useEffect(() => {
        console.log('🔧 useAppStorage hook mounted, loading backup...');
        const loadBackup = async () => {
            try {
                const electronAPI = getElectronAPI();
                console.log('📡 electronAPI available:', !!electronAPI);
                if (electronAPI?.loadStorageBackup) {
                    const backup = await electronAPI.loadStorageBackup();
                    if (backup && typeof backup === 'object') {
                        console.log('📂 Restoring storage backup...');
                        Object.keys(backup).forEach((key: string) => {
                            // Always restore backup data - this ensures accounts are loaded on startup
                            localStorage.setItem(key, backup[key]);
                            
                            // Log if this key has data
                            if (backup[key] && backup[key].length > 2) {  // More than just "[]"
                                console.log(`  ✅ Restored: ${key} (${backup[key].substring(0, 50)}...)`);
                            }
                        });
                        window.dispatchEvent(new CustomEvent('storage-change'));
                    }
                }
                
                // ✅ NEW: Restore media library from backup
                console.log('📚 Loading media library backup...');
                await restoreMediaLibraryFromBackup();
                
            } catch (error) {
                console.error('Error loading backup:', error);
            }
            setIsDataLoaded(true);
        };
        loadBackup();
    }, []);

    // 💾 Save storage backup to Electron file khi có thay đổi
    useEffect(() => {
        if (!isDataLoaded) return;
        
        const saveBackup = () => {
            try {
                const electronAPI = getElectronAPI();
                if (electronAPI?.saveStorageBackup) {
                    const data: Record<string, string> = {};
                    
                    KEYS_TO_BACKUP.forEach(key => {
                        const value = localStorage.getItem(key);
                        if (value) data[key] = value;
                    });
                    
                    if (Object.keys(data).length > 0) {
                        electronAPI.saveStorageBackup(data);
                    }
                }
                
                // ✅ NEW: Backup media library
                backupMediaLibraryToFile().catch(err => {
                    console.error('Error backing up media library:', err);
                });
                
            } catch (error) {
                console.error('Error saving backup:', error);
            }
        };

        window.addEventListener('storage-change', saveBackup);
        const interval = setInterval(saveBackup, 30000); // Save every 30s
        
        return () => {
            window.removeEventListener('storage-change', saveBackup);
            clearInterval(interval);
        };
    }, [isDataLoaded]);

    return { isDataLoaded };
};
