import React, { useState, useEffect } from 'react';
import { Proxy, ProxyStatus, InstagramAccount } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ProxyRowProps {
    account: InstagramAccount;
    proxy?: Proxy;
    isEditing: boolean;
    onEdit: (proxyId: string) => void;           // ✅ Đổi thành string
    onCancel: () => void;
    onSave: (proxyId: string, ip: string, port: string) => void;  // ✅ Đổi thành string
    onDelete: (proxyId: string, accountId: number) => void;        // ✅ Đổi thành string
}

const ProxyRow: React.FC<ProxyRowProps> = ({ account, proxy, isEditing, onEdit, onCancel, onSave, onDelete }) => {
    const [editedIp, setEditedIp] = useState(proxy?.host || '');
    const [editedPort, setEditedPort] = useState(proxy?.port.toString() || '');

    useEffect(() => {
        if (isEditing && proxy) {
            setEditedIp(proxy.host);
            setEditedPort(proxy.port.toString());
        }
    }, [isEditing, proxy]);
    
    const handleSaveClick = () => {
        if (proxy) {
            onSave(proxy.id, editedIp, editedPort);
        }
    };

    const handleDeleteClick = () => {
        if (proxy) {
            onDelete(proxy.id, account.id);
        }
    };

    const handleEditClick = () => {
        if (proxy) {
            onEdit(proxy.id);
        }
    }

    const getStatusClasses = (status: ProxyStatus) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Inactive':
                return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };
    
     const getStatusDotColor = (status: ProxyStatus) => {
        switch (status) {
            case 'Active':
                return 'bg-green-500';
            case 'Inactive':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <tr className="bg-white dark:bg-content-dark border-b dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{account.username}</td>
            
            {proxy ? (
                <>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClasses(proxy.status)}`}>
                            <span className={`w-2 h-2 mr-2 rounded-full ${getStatusDotColor(proxy.status)}`}></span>
                            {proxy.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedIp}
                                onChange={(e) => setEditedIp(e.target.value)}
                                className="w-full px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                        ) : proxy.host}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedPort}
                                onChange={(e) => setEditedPort(e.target.value)}
                                className="w-20 px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                        ) : proxy.port}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 text-sm font-medium">
                            {isEditing ? (
                                <>
                                    <button onClick={handleSaveClick} className="p-2 rounded-full text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors" aria-label="Save proxy">
                                        <MaterialSymbol icon="save" className="text-xl" />
                                    </button>
                                    <button onClick={onCancel} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" aria-label="Cancel edit">
                                        <MaterialSymbol icon="cancel" className="text-xl" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleEditClick} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" aria-label="Edit proxy">
                                        <MaterialSymbol icon="edit" className="text-xl" />
                                    </button>
                                    <button onClick={handleDeleteClick} className="p-2 rounded-full text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" aria-label="Delete proxy">
                                        <MaterialSymbol icon="delete" className="text-xl" />
                                    </button>
                                </>
                            )}
                        </div>
                    </td>
                </>
            ) : (
                <>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-400 dark:text-gray-500 italic">No Proxy Assigned</td>
                    <td className="px-6 py-4"></td>
                </>
            )}
        </tr>
    );
};

export default ProxyRow;