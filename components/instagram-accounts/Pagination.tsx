
import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface PaginationProps {
    accountsPerPage: number;
    totalAccounts: number;
    currentPage: number;
    setCurrentPage: (pageNumber: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ accountsPerPage, totalAccounts, currentPage, setCurrentPage }) => {
    const pageNumbers = [];
    const totalPages = Math.ceil(totalAccounts / accountsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    const firstItem = totalAccounts > 0 ? (currentPage - 1) * accountsPerPage + 1 : 0;
    const lastItem = Math.min(currentPage * accountsPerPage, totalAccounts);

    const handlePrev = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    if (totalAccounts === 0) {
        return (
             <div className="flex items-center justify-center border-t border-gray-200 dark:border-border-dark px-6 py-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">No accounts found.</span>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-border-dark px-6 py-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{firstItem}</span>-<span className="font-semibold text-gray-900 dark:text-white">{lastItem}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalAccounts}</span>
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 enabled:hover:bg-gray-300 dark:enabled:hover:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                >
                    <MaterialSymbol icon="chevron_left" className="text-xl" />
                </button>
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => setCurrentPage(number)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            currentPage === number 
                                ? 'bg-instagram-purple text-white' 
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                        {number}
                    </button>
                ))}
                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 enabled:hover:bg-gray-300 dark:enabled:hover:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                >
                    <MaterialSymbol icon="chevron_right" className="text-xl" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;