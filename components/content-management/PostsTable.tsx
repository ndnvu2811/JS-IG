import React from 'react';
import { Post } from '../../types';
import PostRow from './PostRow';
import MaterialSymbol from '../icons/MaterialSymbol';

interface PostsTableProps {
    filteredPosts: Post[];
    selectedPostIds: Set<number>;
    isAllSelected: boolean;
    onImportFromScraper: () => void;
    onImportFromMediaLibrary: (postId: number) => void;
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectPost: (postId: number) => void;
    onContentChange: (postId: number, content: string) => void;
    onTypeChange: (postId: number, type: 'Post' | 'Reel') => void;
    onPostNow: (postId: number) => void;
    onScheduleChange: (postId: number, dateTime: string) => void;
    onMediaChange: (postId: number, media: { type: 'image' | 'video'; url: string }[]) => void;
    onShareToThreadsChange: (postId: number, value: boolean) => void;
    onAddRow: () => void;
    onRowNumberChange?: (postId: number, rowNumber: number) => void;
    onSaveMedia?: (postId: number) => void;
    onQuickFix?: (postId: number) => void;
    onMediaRemove?: (postId: number, newMedia: { type: 'image' | 'video'; url: string }[]) => void;
}

const PostsTable: React.FC<PostsTableProps> = ({
    filteredPosts,
    selectedPostIds,
    isAllSelected,
    onImportFromScraper,
    onImportFromMediaLibrary,
    onSelectAll,
    onSelectPost,
    onContentChange,
    onTypeChange,
    onPostNow,
    onRowNumberChange,
    onScheduleChange,
    onMediaChange,
    onShareToThreadsChange,
    onAddRow,
    onSaveMedia,
    onQuickFix,
    onMediaRemove,
}) => {
    console.log('📊 PostsTable DEBUG: filteredPosts count:', filteredPosts.length);
    console.log('📊 PostsTable DEBUG: filteredPosts sample:', filteredPosts.slice(0, 3).map(p => ({ id: p.id, content: p.content.substring(0, 30), media: p.media.length })));
    
    return (
        <div className="overflow-x-auto custom-scrollbar rounded-lg border border-gray-200 dark:border-border-dark bg-white dark:bg-content-dark">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 table-fixed">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                    <tr>
                        <th scope="col" className="p-4 w-12">
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
                        <th scope="col" className="px-4 py-3 w-16 text-center font-medium align-middle">#</th>
                        <th scope="col" className="px-4 py-3 w-2/5 font-medium">
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
                        <th scope="col" className="px-4 py-3 w-1/5 font-medium text-center"><div className="flex items-center justify-center gap-2"> <MaterialSymbol icon="perm_media" className="text-base" /> Media </div></th>
                        <th scope="col" className="px-4 py-3 w-[200px] font-medium text-center"><div className="flex items-center justify-center gap-2"> <MaterialSymbol icon="schedule" className="text-base" /> Task </div></th>
                        <th scope="col" className="px-4 py-3 w-[150px] font-medium text-center"><div className="flex items-center justify-center gap-2"> <MaterialSymbol icon="task_alt" className="text-base" /> Status </div></th>
                    </tr>
                </thead>
                <tbody>
                {/* ✅ FIX: Hiển thị tất cả posts, không giới hạn slice(0, 10) */}
                {filteredPosts.map((post, index) => (
                    <PostRow
                    key={post.id}
                    post={post}
                    index={index + 1}
                    isSelected={selectedPostIds.has(post.id)}
                    onSelect={onSelectPost}
                    onContentChange={onContentChange}
                    onTypeChange={onTypeChange}
                    onPostNow={onPostNow}
                    onRowNumberChange={onRowNumberChange}
                    onScheduleChange={onScheduleChange}
                    onMediaChange={onMediaChange}
                    onShareToThreadsChange={onShareToThreadsChange}
                    onSaveMedia={onSaveMedia}
                    onQuickFix={onQuickFix}
                    onMediaRemove={onMediaRemove}
                    onImportFromMediaLibrary={onImportFromMediaLibrary}
                    />
                ))}
                </tbody>

                <tfoot>
                    <tr
                        onClick={onAddRow}
                        className="bg-white dark:bg-content-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    >
                        <td colSpan={6} className="py-2 text-center border-t dark:border-border-dark">
                            <div
                                className="flex items-center justify-center gap-2 mx-auto px-3 py-1 text-sm font-medium rounded-lg text-primary dark:text-primary"
                            >
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

export default PostsTable;