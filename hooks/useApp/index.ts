// Main useApp hook orchestration
// Combines all useApp sub-hooks into a unified interface

import { useApp } from './useApp';
import { useAppIpcListeners } from './useAppIpcListeners';
import { useAppAccounts } from './useAppListeners';
import { useAppNavigation } from './useAppNavigation';
import { useAppStorage } from './useAppStorage';
import { useAppSync } from './useAppSync';

export const useAppMain = () => {
    // Core context
    const appContext = useApp();
    
    // Storage backup/restore
    const { isDataLoaded } = useAppStorage();
    
    // Navigation state
    const { currentView, setCurrentView } = useAppNavigation();
    
    // Account management
    const { accounts, setAccounts, selectedAccount, setSelectedAccount } = useAppAccounts();
    
    // IPC listeners setup
    useAppIpcListeners(accounts);
    
    // Background sync
    useAppSync(accounts);
    
    return {
        // Context
        appContext,
        
        // Storage
        isDataLoaded,
        
        // Navigation
        currentView,
        setCurrentView,
        
        // Accounts
        accounts,
        setAccounts,
        selectedAccount,
        setSelectedAccount,
    };
};

// Export sub-hooks for direct use if needed
export { useApp } from './useApp';
export { useAppIpcListeners } from './useAppIpcListeners';
export { useAppAccounts } from './useAppListeners';
export { useAppNavigation } from './useAppNavigation';
export { useAppStorage } from './useAppStorage';
export { useAppSync } from './useAppSync';

// Default export main hook
export default useAppMain;
