import React from 'react';
import { InstagramAccount } from '../../types';

interface AccountSelectionProps {
    label: string;
    selectedAccountIds: number[];  // ✅ CHANGED TO number[]
    allAccounts: InstagramAccount[];
    onClick: () => void;
    disabled?: boolean;
}

const AccountSelection: React.FC<AccountSelectionProps> = ({
    label,
    selectedAccountIds,
    allAccounts,
    onClick,
    disabled = false,
}) => {
    // Filter accounts to get only selected ones (with useMemo for performance)
    const selectedAccounts = React.useMemo(() => 
        allAccounts.filter(acc => selectedAccountIds.includes(acc.id)),
        [allAccounts, selectedAccountIds]
    );

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
                {label}
            </label>
            
            <div className="flex items-center gap-3">
                {/* Selected accounts avatars */}
                <div className="flex items-center gap-2 flex-wrap">
                    {selectedAccounts.length > 0 ? (
                        selectedAccounts.map(acc => (
                            <div 
                                key={acc.id}
                                className="flex items-center gap-1.5 bg-gray-700/50 pr-2 rounded-full"
                                title={acc.username}
                            >
                                <img 
                                    src={acc.avatarUrl} 
                                    alt={acc.username}
                                    className="w-6 h-6 rounded-full"
                                />
                                <span className="text-xs font-medium text-gray-300">
                                    {acc.username}
                                </span>
                            </div>
                        ))
                    ) : (
                        <span className="text-sm text-gray-500 italic">
                            No accounts selected
                        </span>
                    )}
                </div>

                {/* Select button */}
                <button
                    type="button"
                    onClick={onClick}
                    disabled={disabled}
                    className="px-4 py-2 text-sm font-medium bg-gray-700 rounded-lg hover:bg-gray-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {selectedAccounts.length > 0 ? 'Change' : 'Select'}
                </button>
            </div>

            {/* Selected count */}
            {selectedAccounts.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                    {selectedAccounts.length} account{selectedAccounts.length > 1 ? 's' : ''} selected
                </p>
            )}
        </div>
    );
};

export default AccountSelection;