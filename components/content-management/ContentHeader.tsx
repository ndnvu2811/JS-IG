
import React from 'react';
import { InstagramAccount } from '../../types';
import AccountSelectorDropdown from './AccountSelectorDropdown';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ContentHeaderProps {
    accounts: InstagramAccount[];
    selectedAccount: InstagramAccount;
    onAccountChange: (account: InstagramAccount) => void;
    onBulkAdd: () => void;
}

const ContentHeader: React.FC<ContentHeaderProps> = ({ accounts, selectedAccount, onAccountChange, onBulkAdd }) => {
    return (
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">Content Management</h1>
                <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">Manage your content.</p>
            </div>
            <div className="flex items-center gap-4">
                <AccountSelectorDropdown
                    accounts={accounts}
                    selectedAccount={selectedAccount}
                    onSelectAccount={onAccountChange}
                />
                <button
                    onClick={onBulkAdd}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg btn-instagram px-4 text-sm font-bold">
                    <MaterialSymbol icon="add" className="text-base" />
                    <span>Add in Bulk</span>
                </button>
            </div>
        </header>
    );
};

export default ContentHeader;