import React, { useState, useRef, useEffect } from 'react';
import Pagination from '../components/instagram-accounts/Pagination';
import ConnectAccountModal from '../components/instagram-accounts/ConnectAccountModal';
import { InstagramAccount } from '../types';
import { useInstagramAccounts } from '../hooks/useInstagramAccounts';
import AccountsHeader from '../components/instagram-accounts/AccountsHeader';
import AccountsToolbar from '../components/instagram-accounts/AccountsToolbar';
import AccountsTable from '../components/instagram-accounts/AccountsTable';

interface InstagramAccountsProps {
    accounts: InstagramAccount[];
    setAccounts: React.Dispatch<React.SetStateAction<InstagramAccount[]>>;
}

const InstagramAccounts: React.FC<InstagramAccountsProps> = ({ 
    accounts, 
    setAccounts
}) => {
    // State cho modal
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const listenersInitialized = useRef(false);

    const {
        currentPage,
        setCurrentPage,
        searchQuery,
        setSearchQuery,
        currentAccounts,
        totalAccounts,
        accountsPerPage
    } = useInstagramAccounts(accounts, setAccounts);

    // Handle connect account - nhận data thật từ Electron
    const handleConnect = (accountData: any) => {
        console.log('📥 Receiving account data in InstagramAccounts:', accountData);
        
        setAccounts(prevAccounts => {
            const newAccounts = [accountData, ...prevAccounts];
            console.log('📦 Updated accounts list:', newAccounts);
            return newAccounts;
        });
    };

    // Handle delete account
    const handleDeleteAccount = (accountId: number) => {
        const account = accounts.find(acc => acc.id === accountId);
        if (account && account.cookiesPath) {
            console.log(`🗑️ Deleting account: ${account.username}, cookies: ${account.cookiesPath}`);
            window.electronAPI.deleteAccount(String(accountId), account.cookiesPath, account.username);
        }
        setAccounts(prevAccounts => prevAccounts.filter(acc => acc.id !== accountId));
    };

    // Handle refresh account
    const handleRefreshAccount = (accountId: number, username: string, cookiesPath: string) => {
        console.log(`🔄 Refreshing account: ${username}`);
        window.electronAPI.refreshAccount(accountId, username, cookiesPath);
    };

    // Listen for refresh events - initialize once
    useEffect(() => {
        if (listenersInitialized.current) return;
        
        const handleRefreshSuccess = (data: any) => {
            console.log('✅ Refresh success:', data);
            console.log('📊 Updating account:', data.accountId, 'with avatar:', data.avatar);
            
            setAccounts(prevAccounts => {
                const updated = prevAccounts.map(acc => {
                    if (acc.id === data.accountId) {
                        // Add timestamp to avatar URL to force reload
                        const avatarUrl = data.avatar ? `${data.avatar}?t=${Date.now()}` : acc.avatarUrl;
                        console.log('🎨 Updated avatar URL:', avatarUrl);
                        return {
                            ...acc,
                            avatarUrl: avatarUrl,
                            followers: String(data.followers || 0),
                            following: String(data.following || 0),
                            posts: String(data.posts || 0),
                        };
                    }
                    return acc;
                });
                console.log('📋 Updated accounts:', updated);
                return updated;
            });
        };

        const handleRefreshError = (data: any) => {
            console.error('❌ Refresh error:', data.error);
            alert(`Refresh failed: ${data.error}`);
        };

        // Register listeners once
        window.electronAPI.onRefreshSuccess(handleRefreshSuccess);
        window.electronAPI.onRefreshError(handleRefreshError);
        
        listenersInitialized.current = true;
    }, [setAccounts]);

    return (
        <div className="flex flex-col h-full">
            <AccountsHeader onConnectClick={() => setIsConnectModalOpen(true)} />
            
            <AccountsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-content-dark rounded-lg border border-gray-200 dark:border-border-dark">
                <AccountsTable 
                    accounts={currentAccounts} 
                    onDeleteAccount={handleDeleteAccount}
                    onRefreshAccount={handleRefreshAccount}
                />
                <Pagination 
                    currentPage={currentPage}
                    accountsPerPage={accountsPerPage}
                    totalAccounts={totalAccounts}
                    setCurrentPage={setCurrentPage}
                />
            </div>

            <ConnectAccountModal
                isOpen={isConnectModalOpen}
                onClose={() => setIsConnectModalOpen(false)}
                onConnect={handleConnect}
            />
        </div>
    );
};

export default InstagramAccounts;