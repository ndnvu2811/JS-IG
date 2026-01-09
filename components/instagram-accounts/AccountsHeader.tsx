import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface AccountsHeaderProps {
    onConnectClick: () => void;
}

const AccountsHeader: React.FC<AccountsHeaderProps> = ({ onConnectClick }) => {
    return (
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">Instagram Accounts</h1>
                <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">Manage your connected Instagram accounts.</p>
            </div>
            <div className="flex items-center gap-4">
                <button 
                    onClick={onConnectClick}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg btn-instagram px-4 text-sm font-bold">
                    <MaterialSymbol icon="link" className="text-base" />
                    <span>Connect New Account</span>
                </button>
            </div>
        </header>
    );
};

export default AccountsHeader;