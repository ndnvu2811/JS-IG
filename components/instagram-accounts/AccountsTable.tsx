import React from 'react';
import { InstagramAccount } from '../../types';
import AccountRow from './AccountRow';

interface AccountsTableProps {
    accounts: InstagramAccount[];
    onDeleteAccount: (accountId: number) => void;
    onRefreshAccount: (accountId: number, username: string, cookiesPath: string) => void;
}

const AccountsTable: React.FC<AccountsTableProps> = ({ accounts, onDeleteAccount, onRefreshAccount }) => {
    return (
        <div className="flex-1 overflow-auto table-scrollbar">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 table-fixed">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0 z-10">
                    <tr>
                        <th scope="col" className="px-6 py-3 w-[30%]">Account</th>
                        <th scope="col" className="px-6 py-3 text-center w-[15%]">Status</th>
                        <th scope="col" className="px-6 py-3 text-center w-[10%]">Followers</th>
                        <th scope="col" className="px-6 py-3 text-center w-[10%]">Following</th>
                        <th scope="col" className="px-6 py-3 text-center w-[10%]">Posts</th>
                        <th scope="col" className="px-6 py-3 text-center w-[10%]">Login</th>
                        <th scope="col" className="px-6 py-3 text-center w-[15%]">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map(account => <AccountRow 
                            key={account.id} 
                            account={account} 
                            onDelete={onDeleteAccount}
                            onRefresh={onRefreshAccount}
                        />)}
                </tbody>
            </table>
        </div>
    );
};

export default AccountsTable;
