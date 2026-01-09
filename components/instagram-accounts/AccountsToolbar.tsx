import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface AccountsToolbarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const AccountsToolbar: React.FC<AccountsToolbarProps> = ({ searchQuery, setSearchQuery }) => {
    return (
        <div className="mb-4">
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <MaterialSymbol icon="search" />
                </div>
                <input
                    type="text"
                    placeholder="Search accounts by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-sm pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-border-dark bg-white dark:bg-content-dark text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-instagram-purple focus:border-transparent"
                />
            </div>
        </div>
    );
};

export default AccountsToolbar;