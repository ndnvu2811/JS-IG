import { useState, useMemo, useEffect } from 'react';
import { InstagramAccount } from '../types';

export const useInstagramAccounts = (
    accounts: InstagramAccount[], 
    setAccounts: React.Dispatch<React.SetStateAction<InstagramAccount[]>>
) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const accountsPerPage = 20;

    const filteredAccounts = useMemo(() => {
        if (!searchQuery) {
            return accounts;
        }
        return accounts.filter(account =>
            account.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, accounts]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const indexOfLastAccount = currentPage * accountsPerPage;
    const indexOfFirstAccount = indexOfLastAccount - accountsPerPage;
    const currentAccounts = filteredAccounts.slice(indexOfFirstAccount, indexOfLastAccount);
    
    const totalAccounts = filteredAccounts.length;

    return {
        isModalOpen,
        setIsModalOpen,
        currentPage,
        setCurrentPage,
        searchQuery,
        setSearchQuery,
        currentAccounts,
        totalAccounts,
        accountsPerPage,
    };
};