import React, { useState, useCallback } from 'react';
import AutoResizeTextarea from './AutoResizeTextarea';
import MaterialSymbol from '../icons/MaterialSymbol';

interface BulkAddPostsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddPosts: (parsedData: Array<{ content: string; media: { type: 'image' | 'video'; url: string }[] }>) => void;
}

const initialGridData = () => Array.from({ length: 15 }, () => ({ caption: '', media: '' }));

const BulkAddPostsModal: React.FC<BulkAddPostsModalProps> = ({ isOpen, onClose, onAddPosts }) => {
    const [gridData, setGridData] = useState(initialGridData());
    const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; col: 'caption' | 'media' } | null>(null);

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        
        if (!focusedCell) return;

        const pasteText = e.clipboardData.getData('text/plain');
        
        const rows = [];
        const lines = pasteText.replace(/\r\n/g, '\n').split('\n');
        let isInsideQuotes = false;
        let multilineBuffer = '';

        for (const line of lines) {
            if (isInsideQuotes) {
                multilineBuffer += '\n' + line;
            } else {
                multilineBuffer = line;
            }
            const quoteCount = (multilineBuffer.match(/"/g) || []).length;
            if (quoteCount % 2 === 1) {
                isInsideQuotes = true;
            } else {
                rows.push(multilineBuffer);
                isInsideQuotes = false;
                multilineBuffer = '';
            }
        }
        if(multilineBuffer) {
            rows.push(multilineBuffer);
        }
        const parsedRows = rows.map(row => row.split('\t').map(cell => {
            if (cell.startsWith('"') && cell.endsWith('"')) {
                return cell.substring(1, cell.length - 1).replace(/""/g, '"');
            }
            return cell;
        }));

        setGridData(currentGrid => {
            const newGrid = JSON.parse(JSON.stringify(currentGrid));
            const startRow = focusedCell.rowIndex;
            const startCol = focusedCell.col === 'caption' ? 0 : 1;

            parsedRows.forEach((pastedRow, rowIndexOffset) => {
                const targetRowIndex = startRow + rowIndexOffset;

                while (targetRowIndex >= newGrid.length) {
                    newGrid.push({ caption: '', media: '' });
                }

                pastedRow.forEach((pastedCell, colIndexOffset) => {
                    const targetColIndex = startCol + colIndexOffset;
                    if (targetRowIndex < newGrid.length) {
                        if (targetColIndex === 0) {
                            newGrid[targetRowIndex].caption = pastedCell;
                        } else if (targetColIndex === 1) {
                            newGrid[targetRowIndex].media = pastedCell;
                        }
                    }
                });
            });
            return newGrid;
        });
    };

    const handleCellChange = (rowIndex: number, col: 'caption' | 'media', value: string) => {
        const newData = [...gridData];
        newData[rowIndex][col] = value;
        setGridData(newData);
    };

    const handleParseAndSubmit = () => {
        const parsedData = gridData
            .map(row => {
                const content = row.caption.trim();
                if (!content) {
                    return null;
                }
                const media = row.media
                    ? row.media.split(',')
                        .map(url => url.trim())
                        .filter(url => url)
                        .map(url => ({
                            type: 'image' as 'image' | 'video',
                            url,
                        }))
                    : [];
                return { content, media };
            })
            .filter((item): item is { content: string; media: { type: 'image' | 'video'; url: string }[] } => item !== null);

        if (parsedData.length > 0) {
            onAddPosts(parsedData);
        } else {
            alert('Could not parse any valid posts from the grid.');
        }
        
        handleClose();
    };
    
    const handleClose = () => {
        setGridData(initialGridData());
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div 
                className="relative w-full max-w-4xl h-[90vh] flex flex-col p-6 bg-white rounded-xl shadow-2xl dark:bg-content-dark border border-border-dark"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b dark:border-border-dark">
                    <h2 className="text-xl font-bold dark:text-white">Bulk Add Posts</h2>
                    <button onClick={handleClose} className="p-2 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close modal">
                        <MaterialSymbol icon="close" />
                    </button>
                </div>
                
                <div className="mt-6 flex flex-col flex-1 overflow-hidden">
                     <div className="p-3 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                        <span className="font-medium">Instructions:</span> You can directly paste content from a spreadsheet (e.g., Google Sheets, Excel) into the grid below.
                    </div>
                    
                    <div className="flex-1 overflow-auto table-scrollbar border border-gray-300 dark:border-gray-600 rounded-lg" onPaste={handlePaste}>
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
                                <tr>
                                    <th className="p-2 border-b border-r dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 w-1/2">Caption</th>
                                    <th className="p-2 border-b dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 w-1/2">Media URLs (comma separated)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gridData.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td className="p-0 border-b border-r dark:border-gray-600">
                                            <AutoResizeTextarea
                                                onFocus={() => setFocusedCell({ rowIndex, col: 'caption' })}
                                                value={row.caption}
                                                onChange={(e) => handleCellChange(rowIndex, 'caption', e.target.value)}
                                                className="!border-0 !rounded-none !focus:ring-0 !min-h-0"
                                                rows={2}
                                            />
                                        </td>
                                        <td className="p-0 border-b dark:border-gray-600">
                                            <AutoResizeTextarea
                                                onFocus={() => setFocusedCell({ rowIndex, col: 'media' })}
                                                value={row.media}
                                                onChange={(e) => handleCellChange(rowIndex, 'media', e.target.value)}
                                                className="!border-0 !rounded-none !focus:ring-0 !min-h-0"
                                                rows={2}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-4 mt-auto">
                        <button 
                            type="button" 
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium bg-gray-100 border border-gray-300 rounded-lg dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button"
                            onClick={handleParseAndSubmit}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg btn-instagram"
                        >
                            <span>Add Posts</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkAddPostsModal;