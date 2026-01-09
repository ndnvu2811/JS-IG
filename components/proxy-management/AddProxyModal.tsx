import React, { useState, useEffect } from 'react';
import { Proxy } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ProxyFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (proxyData: { host: string; port: number; type: 'http' | 'https' | 'socks5'; username?: string; password?: string }) => void;
    mode: 'add' | 'edit';
    initialData?: Proxy | null;
}

const AddProxyModal: React.FC<ProxyFormModalProps> = ({ isOpen, onClose, onSubmit, mode, initialData }) => {
    const [host, setHost] = useState('');
    const [port, setPort] = useState('');
    const [type, setType] = useState<'http' | 'https' | 'socks5'>('http');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setHost(initialData.host);
                setPort(initialData.port.toString());
                setType(initialData.type);
                setUsername(initialData.username || '');
                setPassword(initialData.password || '');
            } else {
                setHost('');
                setPort('');
                setType('http');
                setUsername('');
                setPassword('');
            }
        }
    }, [isOpen, mode, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!host || !port) {
            alert('Host and Port are required.');
            return;
        }
        onSubmit({ 
            host, 
            port: parseInt(port), 
            type,
            username: username || undefined, 
            password: password || undefined 
        });
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    const title = mode === 'add' ? 'Add New Proxy' : 'Edit Proxy';
    const submitButtonText = mode === 'add' ? 'Add Proxy' : 'Save Changes';
    const submitButtonIcon = mode === 'add' ? 'add' : 'save';

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="relative w-full max-w-md p-6 m-4 bg-white rounded-xl shadow-2xl dark:bg-content-dark border border-gray-200 dark:border-border-dark transition-transform duration-300 scale-95 animate-in fade-in-0 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-border-dark">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={handleClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close modal">
                        <MaterialSymbol icon="close" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="type" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Proxy Type
                        </label>
                        <select
                            id="type"
                            value={type}
                            onChange={(e) => setType(e.target.value as 'http' | 'https' | 'socks5')}
                            className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="http">HTTP</option>
                            <option value="https">HTTPS</option>
                            <option value="socks5">SOCKS5</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="host" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Host / IP Address
                        </label>
                        <input
                            id="host" 
                            type="text" 
                            value={host} 
                            onChange={(e) => setHost(e.target.value)}
                            className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="e.g., 192.168.1.1" 
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="port" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Port
                        </label>
                        <input
                            id="port" 
                            type="number" 
                            value={port} 
                            onChange={(e) => setPort(e.target.value)}
                            className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="e.g., 8080" 
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                           Username (Optional)
                        </label>
                        <input
                            id="username" 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="proxy_username"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                           Password (Optional)
                        </label>
                        <input
                            id="password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600">
                            Cancel
                        </button>
                        <button type="submit"
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg bg-primary hover:opacity-90 transition-opacity"
                        >
                            <MaterialSymbol icon={submitButtonIcon} className="text-base" />
                            <span>{submitButtonText}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProxyModal;