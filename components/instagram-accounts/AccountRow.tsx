import React, { useState, useEffect } from 'react';
import { AccountStatus, InstagramAccount } from '../../types';
import { InstagramIcon } from '../icons/SocialIcons';
import MaterialSymbol from '../icons/MaterialSymbol';

interface AccountRowProps {
    account: InstagramAccount;
    onDelete: (accountId: number) => void;
    onRefresh: (accountId: number, username: string, cookiesPath: string) => void;
}

const AccountRow: React.FC<AccountRowProps> = ({ account, onDelete, onRefresh }) => {
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);
    const [showCookiesModal, setShowCookiesModal] = useState(false);
    const [cookiesData, setCookiesData] = useState<any>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopyJSON = () => {
        const jsonStr = JSON.stringify(cookiesData.cookies, null, 2);
        navigator.clipboard.writeText(jsonStr).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    useEffect(() => {
        // Check browser status khi component mount
        window.electronAPI.checkBrowserStatus(account.id);

        // Listen for browser events
        const handleBrowserOpened = (data: { accountId: number }) => {
            if (data.accountId === account.id) {
                console.log('✅ Browser opened for:', account.username);
                setIsBrowserOpen(true);
            }
        };

        const handleBrowserClosed = (data: { accountId: number }) => {
            if (data.accountId === account.id) {
                console.log('🔴 Browser closed for:', account.username);
                setIsBrowserOpen(false);
            }
        };

        const handleBrowserStatus = (data: { accountId: number; isOpen: boolean }) => {
            if (data.accountId === account.id) {
                setIsBrowserOpen(data.isOpen);
            }
        };

        const handleBrowserError = (data: { accountId: number; error: string }) => {
            if (data.accountId === account.id) {
                console.error('❌ Browser error:', data.error);
                alert(`Browser error: ${data.error}`);
                setIsBrowserOpen(false);
            }
        };

        window.electronAPI.onBrowserOpened(handleBrowserOpened);
        window.electronAPI.onBrowserClosed(handleBrowserClosed);
        window.electronAPI.onBrowserStatus(handleBrowserStatus);
        window.electronAPI.onBrowserOpenError(handleBrowserError);
        window.electronAPI.onBrowserCloseError(handleBrowserError);

        return () => {
            window.electronAPI.removeAllListeners();
        };
    }, [account.id, account.username]);

    const handleDelete = () => {
        onDelete(account.id);
    };

    const handleRefresh = () => {
        if (account.cookiesPath) {
            onRefresh(account.id, account.username, account.cookiesPath);
        } else {
            alert('No cookies found for this account');
        }
    };

    const handleLoginToggle = async () => {
        if (isBrowserOpen) {
            // Đóng browser
            console.log('🔴 Closing browser for:', account.username);
            window.electronAPI.closeBrowser(account.id);
        } else {
            // Mở browser
            if (!account.cookiesPath) {
                alert('No cookies found for this account. Please reconnect first.');
                return;
            }

            console.log('🚀 Opening browser for:', account.username);
            
            try {
                // Load cookies từ file (giống Refresh)
                const result = await window.electronAPI.loadCookies(account.cookiesPath);
                
                // ✅ FIX: Xử lý response từ IPC handler
                if (!result || !result.success || !result.cookies) {
                    throw new Error(result?.error || 'Failed to load cookies');
                }
                
                console.log('✅ Cookies loaded:', result.cookies.length, 'items');
                window.electronAPI.openBrowser(account.id, account.username, result.cookies);
            } catch (error) {
                console.error('❌ Failed to load cookies:', error);
                alert('Failed to load cookies. Please reconnect the account.');
            }
        }
    };
    
    const getStatusClasses = (status: AccountStatus) => {
        switch (status) {
            case AccountStatus.Connected:
                return 'bg-[#86EFAC] text-green-900 dark:bg-[#86EFAC] dark:text-green-950 capitalize';
            case AccountStatus.Failed:
                return 'bg-[#FCA5A5] text-red-900 dark:bg-[#FCA5A5] dark:text-red-950 capitalize';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 capitalize';
        }
    };

    const getStatusDotClasses = (status: AccountStatus) => {
        switch (status) {
            case AccountStatus.Connected:
                return 'bg-green-600 animate-pulse';
            case AccountStatus.Failed:
                return 'bg-red-600';
            default:
                return 'bg-gray-600';
        }
    };

    return (
        <>
        <tr className="bg-white dark:bg-content-dark border-b dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-instagram-purple via-instagram-red to-instagram-orange">
                        <img className="w-9 h-9 rounded-full border-2 border-content-dark" src={account.avatarUrl} alt={account.username} />
                        <div className="absolute -bottom-1 -right-1 bg-content-dark rounded-full p-0.5">
                            <InstagramIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 dark:text-white">{account.username}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{account.category}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-center">
                {(() => {
                    const isConnected = account.status === AccountStatus.Connected;
                    const isFailed = account.status === AccountStatus.Failed;
                    
                    const bgColor = isConnected ? '#86EFAC' : isFailed ? '#FCA5A5' : '#D1D5DB';
                    const textColor = isConnected ? '#14532d' : isFailed ? '#7f1d1d' : '#374151';
                    const dotColor = isConnected ? '#16a34a' : isFailed ? '#dc2626' : '#6b7280';
                    
                    return (
                        <span 
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                            style={{ backgroundColor: bgColor, color: textColor }}
                        >
                            <span 
                                className="w-2 h-2 mr-2 rounded-full animate-pulse"
                                style={{ backgroundColor: dotColor }}
                            ></span>
                            {account.status}
                        </span>
                    );
                })()}
            </td>
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white text-center">{account.followers}</td>
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white text-center">{account.following}</td>
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white text-center">{account.posts}</td>
            <td className="px-6 py-4 text-center">
                <button
                    onClick={handleLoginToggle}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors w-20 ${
                        isBrowserOpen
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'btn-instagram'
                    }`}
                >
                    {isBrowserOpen ? 'Close' : 'Login'}
                </button>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                    <button 
                        onClick={async () => {
                            if (!account.cookiesPath) {
                                alert('No cookies found for this account');
                                return;
                            }
                            try {
                                const result = await window.electronAPI.loadCookies(account.cookiesPath);
                                if (result && result.success) {
                                    setCookiesData(result);
                                    setShowCookiesModal(true);
                                } else {
                                    alert('Failed to load cookies: ' + (result?.error || 'Unknown error'));
                                }
                            } catch (error) {
                                console.error('Error loading cookies:', error);
                                alert('Failed to load cookies');
                            }
                        }}
                        className="p-2 rounded-full text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors" 
                        aria-label="View cookies"
                    >
                        <MaterialSymbol icon="visibility" className="text-xl" />
                    </button>
                    <button onClick={handleRefresh} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" aria-label="Refresh account">
                        <MaterialSymbol icon="refresh" className="text-xl" />
                    </button>
                    <button onClick={handleDelete} className="p-2 rounded-full text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" aria-label="Delete account">
                         <MaterialSymbol icon="delete" className="text-xl" />
                    </button>
                </div>
            </td>
        </tr>
        
        {/* Cookies Modal - Outside table structure */}
        {showCookiesModal && cookiesData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowCookiesModal(false)}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cookies for {account.username}</h3>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleCopyJSON}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    copySuccess 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-instagram-purple hover:bg-instagram-purple/80 text-white'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <MaterialSymbol icon={copySuccess ? "check" : "content_copy"} className="text-lg" />
                                    {copySuccess ? 'Copied!' : 'Copy JSON'}
                                </div>
                            </button>
                            <button onClick={() => setShowCookiesModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <MaterialSymbol icon="close" className="text-xl" />
                            </button>
                        </div>
                    </div>
                    <div className="p-4 overflow-auto max-h-[60vh] custom-scrollbar">
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-3">📋 How to import cookies:</h4>
                            
                            <div className="mb-4">
                                <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Method 1: Browser Extension (Recommended) ⭐</h5>
                                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside ml-2">
                                    <li>Install <a href="https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg" target="_blank" className="underline hover:text-blue-600">EditThisCookie</a> or <a href="https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm" target="_blank" className="underline hover:text-blue-600">Cookie-Editor</a></li>
                                    <li>Click <strong>"Copy JSON"</strong> button above</li>
                                    <li>Open <strong>instagram.com</strong> in Chrome</li>
                                    <li>Click the extension icon in toolbar</li>
                                    <li>Select <strong>"Import"</strong> and paste the JSON</li>
                                    <li>Press <kbd className="px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded">F5</kbd> to refresh!</li>
                                </ol>
                            </div>
                            
                            <div>
                                <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Method 2: Chrome DevTools (Manual)</h5>
                                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside ml-2">
                                    <li>Open <strong>instagram.com</strong> in Chrome</li>
                                    <li>Press <kbd className="px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded">F12</kbd> → Go to <strong>Application</strong> tab</li>
                                    <li>Storage → Cookies → <strong>https://www.instagram.com</strong></li>
                                    <li>Clear all cookies, then manually add each cookie from JSON below</li>
                                    <li>Press <kbd className="px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded">F5</kbd> to refresh</li>
                                </ol>
                            </div>
                        </div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Account ID:</strong> {cookiesData.accountId}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Username:</strong> {cookiesData.username}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Extracted At:</strong> {new Date(cookiesData.extractedAt).toLocaleString()}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Total Cookies:</strong> {cookiesData.cookies?.length || 0}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                            <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto custom-scrollbar">{JSON.stringify(cookiesData.cookies, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default AccountRow;