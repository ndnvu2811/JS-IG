import { useEffect, useState } from 'react';
import { InstagramAccount } from '../../types';

const getElectronAPI = () => {
    return (window as any).electronAPI;
};

export const useAppAccounts = () => {
    console.log('🔧 useAppAccounts hook initializing...');
    
    const [accounts, setAccounts] = useState<InstagramAccount[]>(() => {
        try {
            const saved = localStorage.getItem('instagram-accounts');
            if (saved && saved !== '[]') {
                console.log('📖 Loaded accounts from localStorage');
                return JSON.parse(saved);
            }
            
            // Can't load backup synchronously from IPC here
            // Will be handled in useEffect below
            console.log('📂 localStorage accounts empty, will recover in useEffect...');
            return [];
        } catch (e) {
            console.error("Failed to load accounts from localStorage", e);
            return [];
        }
    });

    const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);

    // Save accounts to localStorage khi change
    useEffect(() => {
        try {
            localStorage.setItem('instagram-accounts', JSON.stringify(accounts));
        } catch(e) {
            console.error("Failed to save accounts to localStorage", e);
        }
    }, [accounts]);

    // Load accounts from backup on startup
    useEffect(() => {
        // If no accounts yet, try loading from backup or cookies
        if (accounts.length === 0) {
            const loadFromBackup = async () => {
                try {
                    const electronAPI = getElectronAPI();
                    
                    // Try loading from cookies files first (more reliable)
                    if (electronAPI?.loadAccountsFromCookies) {
                        console.log('🔄 Attempting to load accounts from cookies...');
                        const cookieAccounts = await electronAPI.loadAccountsFromCookies();
                        if (Array.isArray(cookieAccounts) && cookieAccounts.length > 0) {
                            console.log('✅ Recovered accounts from cookies:', cookieAccounts.length);
                            setAccounts(cookieAccounts);
                            return;
                        }
                    }
                    
                    // Fallback: Try loading from backup
                    if (electronAPI?.loadStorageBackup) {
                        console.log('🔄 Attempting to load accounts from backup...');
                        const backup = await electronAPI.loadStorageBackup();
                        if (backup && backup['instagram-accounts']) {
                            try {
                                const backupAccounts = JSON.parse(backup['instagram-accounts']);
                                if (Array.isArray(backupAccounts) && backupAccounts.length > 0) {
                                    console.log('✅ Recovered accounts from backup:', backupAccounts.length);
                                    setAccounts(backupAccounts);
                                    return;
                                }
                            } catch (e) {
                                console.error('Failed to parse backup accounts', e);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to load accounts:', error);
                }
            };
            
            loadFromBackup();
        }
    }, []); // Run only once on mount

    // Auto-select first account if not selected
    useEffect(() => {
        const currentView = (window as any).currentView;
        
        if (!selectedAccount && accounts.length > 0 && currentView !== 'calendar') {
            setSelectedAccount(accounts[0]);
        } else if (selectedAccount && !accounts.find(a => a.id === selectedAccount.id)) {
            setSelectedAccount(accounts.length > 0 ? accounts[0] : null);
        }
    }, [accounts, selectedAccount]);

    // Listen for account requests from Electron
    useEffect(() => {
        const handleNavigateToReels = () => {
            (window as any).setCurrentView?.('reels');
        };
        
        const handleNavigateToImageEditor = () => {
            (window as any).setCurrentView?.('imageEditor');
        };

        const handleRequestAccounts = () => {
            console.log('📨 Main process requesting accounts...');
            const electronAPI = getElectronAPI();
            if (electronAPI?.provideInstagramAccounts) {
                electronAPI.provideInstagramAccounts(accounts);
                console.log('📤 Sent accounts to main process:', accounts.length);
            }
        };

        window.addEventListener('navigate-to-reels', handleNavigateToReels);
        window.addEventListener('navigate-to-image-editor', handleNavigateToImageEditor);

        const electronAPI = getElectronAPI();
        let cleanup: (() => void) | undefined;
        if (electronAPI?.onRequestInstagramAccounts) {
            cleanup = electronAPI.onRequestInstagramAccounts(handleRequestAccounts);
        }

        return () => {
            window.removeEventListener('navigate-to-reels', handleNavigateToReels);
            window.removeEventListener('navigate-to-image-editor', handleNavigateToImageEditor);
            cleanup?.();
        };
    }, [accounts]);

    return { accounts, setAccounts, selectedAccount, setSelectedAccount };
};
