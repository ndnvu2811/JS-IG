import React, { useState, useMemo } from 'react';
import Pagination from '../components/instagram-accounts/Pagination';
import AddProxyModal from '../components/proxy-management/AddProxyModal';
import { InstagramAccount, Proxy, ProxyStatus } from '../types';
import MaterialSymbol from '../components/icons/MaterialSymbol';

interface ProxyManagementProps {
    accounts: InstagramAccount[];
    setAccounts: React.Dispatch<React.SetStateAction<InstagramAccount[]>>;
    proxies: Proxy[];
    setProxies: React.Dispatch<React.SetStateAction<Proxy[]>>;
}

const ProxyManagement: React.FC<ProxyManagementProps> = ({ accounts, setAccounts, proxies, setProxies }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);

    const [currentAccountPage, setCurrentAccountPage] = useState(1);
    const [currentProxyPage, setCurrentProxyPage] = useState(1);
    const [testLogs, setTestLogs] = useState<string[][]>([]);
    const itemsPerPage = 20;

    const handleAddProxy = (proxyData: { host: string; port: number; type: 'http' | 'https' | 'socks5'; username?: string; password?: string }) => {
        const newProxy: Proxy = {
            id: Date.now().toString(),
            host: proxyData.host,
            port: proxyData.port,
            type: proxyData.type,
            username: proxyData.username,
            password: proxyData.password,
            status: 'Inactive',
            createdAt: new Date(),
        };
        setProxies(prev => [...prev, newProxy]);
    };
    
    const handleOpenEditModal = (proxy: Proxy) => {
        setEditingProxy(proxy);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingProxy(null);
    };

    const handleUpdateProxy = (updatedProxyData: { host: string; port: number; type: 'http' | 'https' | 'socks5'; username?: string; password?: string }) => {
    if (!editingProxy) return;
    
    const oldProxy = proxies.find(p => p.id === editingProxy.id);
    if (!oldProxy) return;

    // Kiểm tra xem có thay đổi gì không
    const hasChanges = 
        oldProxy.host !== updatedProxyData.host ||
        oldProxy.port !== updatedProxyData.port ||
        oldProxy.type !== updatedProxyData.type ||
        oldProxy.username !== updatedProxyData.username ||
        oldProxy.password !== updatedProxyData.password;

    if (hasChanges) {
        // Nếu có thay đổi → reset status về Inactive
        setProxies(proxies.map(p => 
            p.id === editingProxy.id 
                ? { ...p, ...updatedProxyData, status: 'Inactive' as ProxyStatus } 
                : p
        ));

        // Log thông báo
        setTestLogs(prev => [...prev, [
            `✏️ Proxy updated successfully!`,
            `📌 Host: ${updatedProxyData.host}:${updatedProxyData.port}`,
            `⚠️ Status reset to Inactive`,
            `💡 Please test the proxy to verify it works`
        ]]);

        console.log('✏️ Proxy updated:', updatedProxyData.host);
        } else {
            // Không có thay đổi → giữ nguyên status
            setTestLogs(prev => [...prev, [
                `ℹ️ No changes detected`,
                `📌 Proxy: ${oldProxy.host}:${oldProxy.port}`
            ]]);
        }

        handleCloseEditModal();
    };

    const handleDeleteProxy = (proxyId: string) => {
        setAccounts(prev =>
            prev.map(acc =>
                acc.proxyId === proxyId ? { ...acc, proxyId: undefined } : acc
            )
        );
        setProxies(proxies.filter(p => p.id !== proxyId));
    };

    const handleAssignProxy = (accountId: number, proxyId: string | undefined) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    if (proxyId) {
        // Gán proxy
        const proxy = proxies.find(p => p.id === proxyId);
        if (!proxy) return;

        // Kiểm tra trạng thái proxy
        if (proxy.status === 'Failed') {
            console.error('❌ Cannot assign failed proxy:', proxy.host);
            setTestLogs(prev => [...prev, [
                `❌ Cannot assign proxy: ${proxy.host}:${proxy.port}`,
                `⚠️ This proxy is not working (Status: Failed)`,
                `💡 Please test the proxy first before assigning`
            ]]);
            return;
        }

        if (proxy.status === 'Inactive') {
            console.warn('⚠️ Assigning untested proxy:', proxy.host, 'to', account.username);
            setTestLogs(prev => [...prev, [
                `⚠️ Warning: Assigning untested proxy`,
                `📌 Proxy ${proxy.host}:${proxy.port} assigned to @${account.username}`,
                `💡 Recommended: Test the proxy to ensure it works`
            ]]);
        } else {
            console.log('✅ Proxy assigned:', proxy.host, '→', account.username);
            setTestLogs(prev => [...prev, [
                `✅ Proxy assigned successfully!`,
                `📌 Proxy: ${proxy.host}:${proxy.port}`,
                `👤 Account: @${account.username}`,
                `⚡ Status: ${proxy.status.toUpperCase()}`
            ]]);
        }
        } else {
            // Gỡ proxy
            console.log('🔓 Proxy removed from:', account.username);
            setTestLogs(prev => [...prev, [
                `🔓 Proxy removed from account`,
                `👤 Account: @${account.username}`,
                `📌 No proxy assigned`
            ]]);
        }

        setAccounts(prev =>
            prev.map(acc =>
                acc.id === accountId ? { ...acc, proxyId } : acc
                )
            );
        };

    const handleTestProxy = async (proxyId: string) => {
    const proxy = proxies.find(p => p.id === proxyId);
    if (!proxy) return;

    // Đặt trạng thái testing
    setProxies(prev => prev.map(p => 
        p.id === proxyId ? { ...p, status: 'Testing' as ProxyStatus } : p
    ));

    // Log bắt đầu - Thêm group mới
    setTestLogs(prev => [...prev, [
        `🔵 Testing proxy: ${proxy.host}:${proxy.port}`,
        `🔵 Target URL: https://api.ipify.org?format=json`
    ]]);

    try {
        if (!window.electronAPI || !window.electronAPI.testProxy) {
            throw new Error('Electron API not available');
        }

        const startTime = Date.now();
        
        const proxyAuth = proxy.username && proxy.password 
            ? `${proxy.username}:${proxy.password}@` 
            : '';
        const proxyUrl = `${proxy.type}://${proxyAuth}${proxy.host}:${proxy.port}`;

        const response = await window.electronAPI.testProxy({
            url: 'https://api.ipify.org?format=json',
            proxy: proxyUrl
        });

        const responseTime = Date.now() - startTime;

        if (response.success) {
            setTestLogs(prev => [...prev, [
                `✅ Proxy test SUCCESS!`,
                `📊 Response time: ${responseTime} ms`,
                `🌐 Your IP via proxy: ${response.data?.ip || 'N/A'}`
            ]]);
            
            setProxies(prev => prev.map(p => 
                p.id === proxyId ? { 
                    ...p, 
                    status: 'Active' as ProxyStatus,
                    responseTime: responseTime,
                    lastTested: new Date()
                } : p
            ));
        } else {
            setTestLogs(prev => [...prev, [
                `❌ Proxy test FAILED: ${response.error}`
            ]]);
            
            setProxies(prev => prev.map(p => 
                p.id === proxyId ? { 
                    ...p, 
                    status: 'Failed' as ProxyStatus,
                    lastTested: new Date()
                } : p
            ));
        }
        } catch (error) {
            console.error('Test proxy error:', error);
            setTestLogs(prev => [...prev, [
                `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            ]]);
            
            setProxies(prev => prev.map(p => 
                p.id === proxyId ? { 
                    ...p, 
                    status: 'Failed' as ProxyStatus,
                    lastTested: new Date()
                } : p
            ));
        }
    };

    const currentAccounts = useMemo(() => {
        const indexOfLastAccount = currentAccountPage * itemsPerPage;
        const indexOfFirstAccount = indexOfLastAccount - itemsPerPage;
        return accounts.slice(indexOfFirstAccount, indexOfLastAccount);
    }, [currentAccountPage, accounts]);

    const currentProxies = useMemo(() => {
        const indexOfLastProxy = currentProxyPage * itemsPerPage;
        const indexOfFirstProxy = indexOfLastProxy - itemsPerPage;
        return proxies.slice(indexOfFirstProxy, indexOfLastProxy);
    }, [currentProxyPage, proxies]);

    return (
        <div className="flex flex-col h-full">
            <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">Proxy Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">Manage your proxy settings.</p>
                </div>

                {/* Test Log Box - Bên phải */}
                {testLogs.length > 0 && (
                    <div className="flex-1 max-w-md p-3 bg-gray-900 dark:bg-gray-800 rounded-lg border border-gray-700">
                        <div className="space-y-2 font-mono text-xs h-20 overflow-y-auto table-scrollbar">
                            {testLogs.map((logGroup, groupIndex) => (
                                <React.Fragment key={groupIndex}>
                                    <div className="space-y-0.5">
                                        {logGroup.map((log, logIndex) => (
                                            <div key={logIndex} className="text-gray-300 leading-relaxed">{log}</div>
                                        ))}
                                    </div>
                                    {groupIndex < testLogs.length - 1 && (
                                        <div className="border-t border-gray-700"></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
                {/* Proxy Pool Table */}
                <div className="lg:w-3/5 flex flex-col">
                    <div className="flex items-center justify-between mb-4 h-10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Proxy Pool</h2>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                        >
                            <MaterialSymbol icon="add" className="text-base" />
                            <span>Add Proxy</span>
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-content-dark rounded-lg border border-gray-200 dark:border-border-dark">
                        <div className="flex-1 overflow-auto table-scrollbar">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">HOST</th>
                                        <th scope="col" className="px-6 py-3 font-medium">PORT</th>
                                        <th scope="col" className="px-6 py-3 font-medium text-center">STATUS</th>
                                        <th scope="col" className="px-6 py-3 font-medium text-center">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProxies.map(proxy => (
                                        <tr key={proxy.id} className="bg-white dark:bg-content-dark border-b dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-6 py-4">{proxy.host}</td>
                                            <td className="px-6 py-4">{proxy.port}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span 
                                                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                                                        style={{
                                                            backgroundColor: proxy.status === 'Active' ? 'rgba(34, 197, 94, 0.2)' : 
                                                                            proxy.status === 'Testing' ? 'rgba(234, 179, 8, 0.2)' : 
                                                                            'rgba(239, 68, 68, 0.2)',
                                                            color: proxy.status === 'Active' ? '#86efac' : 
                                                                proxy.status === 'Testing' ? '#fde047' : 
                                                                '#fca5a5',
                                                            borderColor: proxy.status === 'Active' ? 'rgba(34, 197, 94, 0.5)' : 
                                                                        proxy.status === 'Testing' ? 'rgba(234, 179, 8, 0.5)' : 
                                                                        'rgba(239, 68, 68, 0.5)'
                                                        }}
                                                    >
                                                        {proxy.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleTestProxy(proxy.id)} 
                                                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                                                        title="Test Proxy"
                                                    >
                                                        Test
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenEditModal(proxy)} 
                                                        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        title="Edit Proxy"
                                                    >
                                                        <MaterialSymbol icon="edit" className="text-xl" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteProxy(proxy.id)} 
                                                        className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                                                        title="Delete Proxy"
                                                    >
                                                        <MaterialSymbol icon="delete" className="text-xl" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         {proxies.length > itemsPerPage && (
                            <Pagination
                                currentPage={currentProxyPage}
                                accountsPerPage={itemsPerPage}
                                totalAccounts={proxies.length}
                                setCurrentPage={setCurrentProxyPage}
                            />
                        )}
                    </div>
                </div>

                {/* Account Assignments Table */}
                <div className="lg:w-2/5 flex flex-col">
                    <div className="flex items-center mb-4 h-10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Proxy Assignments</h2>
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-content-dark rounded-lg border border-gray-200 dark:border-border-dark">
                        <div className="flex-1 overflow-auto table-scrollbar">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">ACCOUNT</th>
                                        <th scope="col" className="px-6 py-3 font-medium">ASSIGNED PROXY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentAccounts.map(account => (
                                        <tr key={account.id} className="bg-white dark:bg-content-dark border-b dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{account.username}</td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={account.proxyId || ''}
                                                    onChange={(e) => handleAssignProxy(account.id, e.target.value || undefined)}
                                                    className="w-full max-w-xs px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                                >
                                                    <option value="">- No Proxy -</option>
                                                    {proxies.map(p => (
                                                        <option key={p.id} value={p.id}>{p.host}:{p.port}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         <Pagination
                            currentPage={currentAccountPage}
                            accountsPerPage={itemsPerPage}
                            totalAccounts={accounts.length}
                            setCurrentPage={setCurrentAccountPage}
                        />
                    </div>
                </div>
            </div>
            
            <AddProxyModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddProxy}
                mode="add"
            />

            <AddProxyModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onSubmit={handleUpdateProxy}
                mode="edit"
                initialData={editingProxy}
            />
        </div>
    );
};

export default ProxyManagement;