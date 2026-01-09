
import React, { useState, useRef, useEffect } from 'react';
import { InstagramAccount } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';

interface AccountSelectorDropdownProps {
    accounts: InstagramAccount[];
    selectedAccount: InstagramAccount;
    onSelectAccount: (account: InstagramAccount) => void;
}

const AccountSelectorDropdown: React.FC<AccountSelectorDropdownProps> = ({ accounts, selectedAccount, onSelectAccount }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (account: InstagramAccount) => {
        onSelectAccount(account);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-content-dark border border-gray-200 dark:border-border-dark hover:bg-gray-200 dark:hover:bg-gray-700/50"
            >
                <img alt={selectedAccount.username} className="h-6 w-6 rounded-full" src={selectedAccount.avatarUrl} />
                <span className="font-medium text-sm text-gray-900 dark:text-white">{selectedAccount.username}</span>
                <MaterialSymbol icon={isOpen ? 'expand_less' : 'expand_more'} className="text-gray-500 dark:text-gray-400" />
            </button>
            {isOpen && (
                <div className="absolute z-20 mt-2 w-64 rounded-lg shadow-lg bg-white dark:bg-content-dark border border-gray-200 dark:border-border-dark right-0">
                    <ul className="py-1 max-h-60 overflow-y-auto table-scrollbar">
                        {accounts.map(account => (
                            <li key={account.id}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleSelect(account); }}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <img alt={account.username} className="h-6 w-6 rounded-full" src={account.avatarUrl} />
                                    <span>{account.username}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AccountSelectorDropdown;