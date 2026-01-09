import React from 'react';
import { Reel } from '../../types';
import ReelRow from './ReelRow';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ReelsTableProps {
    filteredReels: Reel[];
    selectedReelIds: Set<number>;
    isAllSelected: boolean;
    onImportFromScraper: () => void;
    onImportFromMediaLibrary: (reelId: number) => void;
    onEditVideos: () => void;
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectReel: (reelId: number) => void;
    onContentChange: (reelId: number, content: string) => void;
    onVideoChange: (reelId: number, video: { url: string }) => void;
    onPostNow: (reelId: number) => void;
    onScheduleChange: (reelId: number, dateTime: string) => void;
    onShareToThreadsChange: (reelId: number, value: boolean) => void;
    onAddRow: () => void;
    onDeleteReel: (reelId: number) => void;
    onAspectRatioChange: (reelId: number, ratio: string) => void;
    onRowNumberChange?: (reelId: number, rowNumber: number) => void;
    onSaveVideo?: (reelId: number) => void;
}

const ReelsTable: React.FC<ReelsTableProps> = ({
    filteredReels,
    selectedReelIds,
    isAllSelected,
    onImportFromScraper,
    onImportFromMediaLibrary,
    onEditVideos,
    onSelectAll,
    onSelectReel,
    onContentChange,
    onVideoChange,
    onPostNow,
    onScheduleChange,
    onShareToThreadsChange,
    onAddRow,
    onDeleteReel,
    onAspectRatioChange,
    onRowNumberChange,
    onSaveVideo
}) => {
    return (
        <div className="overflow-x-auto custom-scrollbar rounded-lg border border-gray-200 dark:border-border-dark bg-white dark:bg-content-dark">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 rounded-lg overflow-hidden">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0 z-10">
                    <tr>
                        <th scope="col" className="p-4 w-4">
                            <div className="flex items-center">
                                <input
                                    id="checkbox-all"
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={onSelectAll}
                                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                                <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                            </div>
                        </th>
                        <th scope="col" className="px-4 py-3 w-12 text-center font-medium">#</th>
                        <th scope="col" className="px-4 py-3 w-1/3 font-medium">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                <MaterialSymbol icon="description" className="text-base" />
                                Content
                                </div>
                            <button
                                onClick={onImportFromScraper}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-purple-300 bg-white/5 border border-white/10 rounded-md hover:bg-purple-500/10 hover:text-purple-200 transition">
                                <MaterialSymbol icon="download" className="text-sm" />
                                Import
                            </button>
                            </div>
                        </th>
                        <th scope="col" className="px-4 py-3 w-[180px] font-medium text-center">
                            <div className="flex items-center justify-center gap-3">
                                <div className="flex items-center gap-2">
                                    <MaterialSymbol icon="videocam" className="text-base" />
                                    Video
                                </div>
                                <button
                                    onClick={onEditVideos}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-purple-300 bg-white/5 border border-white/10 rounded-md hover:bg-purple-500/10 hover:text-purple-200 transition">
                                    <MaterialSymbol icon="auto_fix_high" className="text-sm" />
                                    Edit
                                </button>
                            </div>
                        </th>
                        <th scope="col" className="px-4 py-3 w-[280px] font-medium text-center">
                            <div className="flex items-center justify-center gap-2">
                                <MaterialSymbol icon="schedule" className="text-base" />
                                Task
                            </div>
                        </th>
                        <th scope="col" className="px-4 py-3 w-[150px] font-medium text-center">
                            <div className="flex items-center justify-center gap-2">
                                <MaterialSymbol icon="task_alt" className="text-base" />
                                Status
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filteredReels.map((reel, index) => (
                        <ReelRow
                            key={reel.id}
                            reel={reel}
                            index={index + 1}
                            isSelected={selectedReelIds.has(reel.id)}
                            onSelect={onSelectReel}
                            onContentChange={onContentChange}
                            onVideoChange={onVideoChange}
                            onPostNow={onPostNow}
                            onScheduleChange={onScheduleChange}
                            onShareToThreadsChange={onShareToThreadsChange}
                            onDeleteReel={onDeleteReel}
                            onAspectRatioChange={onAspectRatioChange}
                            onSaveVideo={onSaveVideo}
                            onRowNumberChange={onRowNumberChange}
                            onImportFromMediaLibrary={onImportFromMediaLibrary}
                        />
                    ))}
                </tbody>
                <tfoot>
                    <tr
                        onClick={onAddRow}
                        className="bg-white dark:bg-content-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    >
                        <td colSpan={7} className="py-2 text-center border-t dark:border-border-dark">
                            <div className="flex items-center justify-center gap-2 mx-auto px-3 py-1 text-sm font-medium rounded-lg text-primary dark:text-primary">
                                <MaterialSymbol icon="add" className="text-base" />
                                <span>Add Row</span>
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default ReelsTable;