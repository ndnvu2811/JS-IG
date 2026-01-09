import React from 'react';
import { InstagramAccount } from '../../types';
import AccountSelectorDropdown from '../content-management/AccountSelectorDropdown';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ReelsHeaderProps {
    accounts: InstagramAccount[];
    selectedAccount: InstagramAccount;
    onAccountChange: (account: InstagramAccount) => void;
    onBulkAdd: () => void;
}

const ReelsHeader: React.FC<ReelsHeaderProps> = ({ accounts, selectedAccount, onAccountChange, onBulkAdd }) => {
    return (
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">
                    Reels Management
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                    Create, schedule and manage Instagram Reels for your account
                </p>
            </div>
            <div className="flex items-center gap-4">
                <AccountSelectorDropdown
                    accounts={accounts}
                    selectedAccount={selectedAccount}
                    onSelectAccount={onAccountChange}
                />
            </div>
        </header>
    );
};

export default ReelsHeader;