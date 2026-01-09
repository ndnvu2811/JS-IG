
import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface LibraryHeaderProps {
    title: string;
    description: string;
    selectedCount: number;
    onDeleteSelected: () => void;
    onUploadClick: () => void;
}

const LibraryHeader: React.FC<LibraryHeaderProps> = ({
    title, description, selectedCount, onDeleteSelected, onUploadClick
}) => {
    return (
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">{title}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">{description}</p>
            </div>
            <div className="flex items-center gap-4">
                {selectedCount > 0 && (
                    <button
                        onClick={onDeleteSelected}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 px-5 text-sm font-bold text-white shadow-lg animate-in fade-in zoom-in-95"
                    >
                        <MaterialSymbol icon="delete" className="text-base" />
                        <span>Delete Selected ({selectedCount})</span>
                    </button>
                )}
                <button
                    onClick={onUploadClick}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg btn-instagram px-5 text-sm font-bold shadow-lg"
                >
                    <MaterialSymbol icon="add_photo_alternate" className="text-base" />
                    <span>Upload Media</span>
                </button>
            </div>
        </header>
    );
};

export default LibraryHeader;
