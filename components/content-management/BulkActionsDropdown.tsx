
import React, { useState, useRef, useEffect } from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface BulkActionsDropdownProps {
    selectedCount: number;
    onSchedule: () => void;
    onClearSchedule: () => void;
    onDelete: () => void;
}

const BulkActionsDropdown: React.FC<BulkActionsDropdownProps> = ({ selectedCount, onSchedule, onClearSchedule, onDelete }) => {
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
    
    const disabled = selectedCount === 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span>Bulk Actions</span>
                 <MaterialSymbol icon={isOpen ? 'expand_less' : 'expand_more'} className="text-base" />
            </button>
            {isOpen && !disabled && (
                 <div className="absolute z-20 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-content-dark border border-gray-200 dark:border-border-dark">
                    <ul className="py-1">
                        <li>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); onSchedule(); setIsOpen(false); }}
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Schedule...
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); onClearSchedule(); setIsOpen(false); }}
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Clear Schedule
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); onDelete(); setIsOpen(false); }}
                                className="block px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                                Delete
                            </a>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BulkActionsDropdown;