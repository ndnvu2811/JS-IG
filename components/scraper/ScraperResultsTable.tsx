import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';
import AutoResizeTextarea from '../content-management/AutoResizeTextarea';
import ScraperEmptyState from './ScraperEmptyState';
import { ScraperResult } from '../../types';

interface ScraperResultsTableProps {
    results: ScraperResult[];
    isLoading: boolean;
    statusMessage: string;
    progress: number;
    selectedIds: Set<string>;
    onSelectChange: (ids: Set<string>) => void;
    onDeleteSelected: () => void;
    onFieldChange: (id: string, field: keyof ScraperResult, value: string) => void;
    onAddRow: () => void;
    onExport: () => void;
    onMediaPreview: (result: ScraperResult) => void;
    onGoToConfig: () => void;
}

const ScraperResultsTable: React.FC<ScraperResultsTableProps> = ({
    results,
    isLoading,
    statusMessage,
    progress,
    selectedIds,
    onSelectChange,
    onDeleteSelected,
    onFieldChange,
    onAddRow,
    onExport,
    onMediaPreview,
    onGoToConfig
}) => {
    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-content-dark flex-1 rounded-2xl border border-gray-200 dark:border-border-dark shadow-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-border-dark flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-instagram-orange/10 text-instagram-orange">
                            <MaterialSymbol icon="list_alt" className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Scraper Dashboard
                            </h2>
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-instagram-purple rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400">{statusMessage}</span>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {results.length} items scraped
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onAddRow}
                            className="px-4 py-2 text-sm rounded-[10px] flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition-colors"
                        >
                            <MaterialSymbol icon="add" className="text-base" />
                            Add Row
                        </button>
                        <button
                            onClick={onExport}
                            disabled={results.length === 0}
                            className="px-4 py-2 text-sm rounded-[10px] flex items-center gap-2 bg-slate-600 text-white hover:bg-slate-500 transition-colors"
                        >
                            <MaterialSymbol icon="download" className="text-base" />
                            Export
                        </button>
                        <button
                            onClick={onDeleteSelected}
                            disabled={selectedIds.size === 0}
                            className="px-4 py-2 text-sm rounded-[10px] flex items-center gap-2 border border-red-500/60 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                        >
                            <MaterialSymbol icon="delete" className="text-base" />
                            {selectedIds.size > 0 ? `Delete (${selectedIds.size})` : 'Delete'}
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto table-scrollbar bg-[#f8f9fa] dark:bg-background-dark/50">
                    {results.length > 0 ? (
                        <table className="w-full text-sm text-center border-collapse">
                            <thead className="sticky top-0 z-20 bg-gray-900/95 text-white backdrop-blur border-b border-white/10">
                                <tr>
                                    <th className="w-4 p-4 align-middle">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={results.length > 0 && selectedIds.size === results.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        onSelectChange(new Set(results.map(r => r.id)));
                                                    } else {
                                                        onSelectChange(new Set());
                                                    }
                                                }}
                                                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                    </th>
                                    <th className="px-2 py-3 font-bold border-r border-gray-800 uppercase text-[10px] tracking-wider text-center" style={{ width: '5%' }}>
                                        No.
                                    </th>
                                    <th className="px-2 py-3 font-bold border-r border-gray-800 uppercase text-[10px] tracking-wider text-center" style={{ width: '40%' }}>
                                        Caption
                                    </th>
                                    <th className="px-2 py-3 font-bold border-r border-gray-800 uppercase text-[10px] tracking-wider text-center" style={{ width: '40%' }}>
                                        New Caption
                                    </th>
                                    <th className="px-2 py-3 font-bold uppercase text-[10px] tracking-wider text-center" style={{ width: '15%' }}>
                                        Media
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-content-dark">
                                {results.map((res) => (
                                    <tr 
                                        key={res.id} 
                                        className="odd:bg-white even:bg-gray-50/60 dark:odd:bg-content-dark dark:even:bg-gray-800/20 hover:bg-gray-100/70 dark:hover:bg-gray-800/40 transition-colors"
                                    >   
                                        <td className="w-4 p-4 align-middle">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(res.id)}
                                                    onChange={(e) => {
                                                        const newSet = new Set(selectedIds);
                                                        if (e.target.checked) {
                                                            newSet.add(res.id);
                                                        } else {
                                                            newSet.delete(res.id);
                                                        }
                                                        onSelectChange(newSet);
                                                    }}
                                                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </div>
                                        </td>
                                        {/* NO. */}
                                        <td className="px-2 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs border-r border-gray-200/70 dark:border-gray-700/40 align-middle text-center">
                                            <input
                                                type="number"
                                                value={res.stt}
                                                onChange={(e) => {
                                                    const newStt = parseInt(e.target.value) || 0;
                                                    onFieldChange(res.id, 'stt', newStt.toString());
                                                    
                                                    // Auto-update các dòng sau +1
                                                    const currentIndex = results.findIndex(r => r.id === res.id);
                                                    results.slice(currentIndex + 1).forEach((r, i) => {
                                                        onFieldChange(r.id, 'stt', (newStt + i + 1).toString());
                                                    });
                                                }}
                                                className="w-16 bg-transparent border border-gray-600 rounded px-2 py-1 text-center text-white focus:border-purple-500 focus:outline-none"
                                            />
                                            <button
                                            onClick={async () => {
                                                try {
                                                    const apiKey = localStorage.getItem('gemini-api-key');
                                                    if (!apiKey) {
                                                        alert('⚠️ Gemini API Key not configured.\nGo to Settings > Google AI Settings to add your key.');
                                                        return;
                                                    }

                                                    console.log('🤖 Sending to Gemini:', { caption: res.caption });
                                                    
                                                    const response = await fetch(
                                                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                                                        {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                contents: [
                                                                    {
                                                                        parts: [
                                                                        {
                                                                        text: `Rewrite and rephrase the Instagram caption below.

                                                                        Rules:
                                                                        - Keep the same meaning and vibe
                                                                        - Use different wording and sentence structure
                                                                        - Remove any purchase or contact information
                                                                        - Keep all hashtags unchanged
                                                                        - Do NOT copy sentences verbatim from the original
                                                                        - Do not add new information

                                                                        Caption:
                                                                        ${res.caption}`
                                                                        }
                                                                        ]
                                                                    }
                                                                ]
                                                            })
                                                        }
                                                    );
                                                    
                                                    if (!response.ok) {
                                                        const error = await response.json();
                                                        throw new Error(error.error?.message || `API error: ${response.status}`);
                                                    }
                                                    
                                                    const data = await response.json();
                                                    console.log('📨 Gemini Response:', data);
                                                    
                                                    const newCaption = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                                                    if (!newCaption) {
                                                        alert('⚠️ Gemini returned empty caption.');
                                                        return;
                                                    }
                                                    
                                                    onFieldChange(res.id, 'captionNew', newCaption);
                                                    console.log('✅ Caption updated successfully');
                                                } catch (error: any) {
                                                    console.error('❌ AI Generate error:', error);
                                                    alert(`Error: ${error.message}`);
                                                }
                                            }}
                                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 bg-white/5 border border-white/10 rounded-md hover:bg-purple-500/10 hover:text-purple-200 transition backdrop-blur">
                                            <MaterialSymbol icon="auto_awesome" className="text-sm opacity-80" />
                                            Generate
                                            </button>
                                        </td>
                                        
                                        {/* CAPTION */}
                                        <td className="px-2 py-3 align-middle border-r border-gray-200/70 dark:border-gray-700/40 custom-scrollbar">
                                            <AutoResizeTextarea
                                                value={res.caption}
                                                onChange={(e) => onFieldChange(res.id, 'caption', e.target.value)}
                                            />
                                        </td>
                                        
                                        {/* NEW CAPTION */}
                                        <td className="px-2 py-3 align-middle border-r border-gray-200/70 dark:border-gray-700/40 custom-scrollbar">
                                            <AutoResizeTextarea
                                                value={res.captionNew}
                                                onChange={(e) => onFieldChange(res.id, 'captionNew', e.target.value)}
                                                placeholder="Write new caption..."
                                            />
                                        </td>
                                        
                                        <td className="px-2 py-3 align-middle">
                                        <div className="flex flex-col items-center gap-2">

                                            {/* TYPE (Image / Video) */}
                                            {res.media && res.media.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    {res.media[0].type === 'video' ? (
                                                        <>
                                                            <MaterialSymbol icon="video_library" className="text-sm text-blue-400" />
                                                            <span className="text-xs font-medium text-blue-400">Video</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MaterialSymbol icon="image" className="text-sm text-green-400" />
                                                            <span className="text-xs font-medium text-green-400">Image</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* FOLDER ICON */}
                                            {(res.imageUrl || (res.media && res.media.length > 0)) ? (
                                                <div
                                                    onClick={() => onMediaPreview(res)}
                                                    className="flex items-center justify-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
                                                    title="Click to view media"
                                                >
                                                    <MaterialSymbol
                                                        icon="folder"
                                                        className="w-10 h-10 text-yellow-400 hover:text-yellow-300 transition-colors"
                                                    />
                                                    <span className="font-bold text-gray-500">
                                                        {res.media?.length || 1}
                                                    </span>
                                                </div>
                                            ) : (
                                                <MaterialSymbol icon="folder_off" className="w-8 h-8 text-gray-400 opacity-30" />
                                            )}

                                            {/* URL */}
                                            {res.url && (
                                                <button
                                                    onClick={() => (window as any).electronAPI?.openExternalLink(res.url)}
                                                    className="text-blue-400 hover:text-blue-300 underline break-all text-center text-xs"
                                                >
                                                    {res.url}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <ScraperEmptyState onGoToConfig={onGoToConfig} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScraperResultsTable;