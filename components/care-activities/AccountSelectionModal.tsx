import React, { useState, useEffect, useMemo } from 'react';
import { InstagramAccount } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';

interface AccountSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedIds: number[]) => void;
    allAccounts: InstagramAccount[];
    selectedAccountIds: number[];
    title: string;
}

const AccountSelectionModal: React.FC<AccountSelectionModalProps> = ({ isOpen, onClose, onSave, allAccounts, selectedAccountIds, title }) => {
    const [selection, setSelection] = useState(new Set<number>());

    useEffect(() => {
        if (isOpen) {
            setSelection(new Set(selectedAccountIds));
        }
    }, [isOpen, selectedAccountIds]);

    const handleToggle = (accountId: number) => {
        setSelection(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(accountId)) {
                newSelection.delete(accountId);
            } else {
                newSelection.add(accountId);
            }
            return newSelection;
        });
    };

    const handleSelectAll = () => {
        setSelection(new Set(allAccounts.map(a => a.id)));
    };

    const handleDeselectAll = () => {
        setSelection(new Set());
    };
    
    const handleSave = () => {
        onSave(Array.from(selection));
    };

    if (!isOpen) {
        return null;
    }

    const isAllSelected = selection.size === allAccounts.length;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="relative w-full max-w-lg h-[70vh] flex flex-col p-6 m-4 bg-white rounded-xl shadow-2xl dark:bg-content-dark border border-gray-200 dark:border-border-dark transition-transform duration-300 scale-95 animate-in fade-in-0 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-border-dark flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close modal">
                        <MaterialSymbol icon="close" />
                    </button>
                </div>
                
                <div className="my-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={handleSelectAll} 
                            disabled={isAllSelected}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 border border-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                         >
                            Select All
                         </button>
                         <button 
                            onClick={handleDeselectAll}
                            disabled={selection.size === 0}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 border border-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                         >
                            Deselect All
                         </button>
                    </div>
                     <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-bold text-white">{selection.size}</span> / {allAccounts.length} selected
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto table-scrollbar -mx-6 px-6 space-y-2">
                    {allAccounts.map(account => {
                        const isSelected = selection.has(account.id);
                        return (
                            <div
                                key={account.id}
                                onClick={() => handleToggle(account.id)}
                                className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-purple-900/50 ring-2 ring-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    readOnly
                                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-500 rounded focus:ring-purple-600 focus:ring-2 pointer-events-none"
                                />
                                <img src={account.avatarUrl} alt={account.username} className="w-8 h-8 rounded-full" />
                                <div className="flex-1">
                                    <p className="font-bold text-white">{account.username}</p>
                                    <p className="text-xs text-gray-400">{account.category}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-gray-200 dark:border-border-dark flex-shrink-0">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button"
                        onClick={handleSave}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg bg-purple-600 hover:bg-purple-700"
                    >
                        <span>Save Selection</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountSelectionModal;