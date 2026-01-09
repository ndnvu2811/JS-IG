import React, { useState, useRef } from 'react';
import MaterialSymbol from './icons/MaterialSymbol';
import { generateAvatar } from '../utils/avatarUtils';

interface WorkspaceEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    currentAvatar: string | null;
    onSave: (name: string, avatar: string | null) => void;
}

const WorkspaceEditModal: React.FC<WorkspaceEditModalProps> = ({ isOpen, onClose, currentName, currentAvatar, onSave }) => {
    const [name, setName] = useState(currentName);
    const [avatar, setAvatar] = useState<string | null>(currentAvatar);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        setAvatar(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name, avatar);
            onClose();
        }
    };

    if (!isOpen) return null;

    const displayAvatar = avatar || generateAvatar(name || 'Workspace');

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-md p-6 m-4 bg-white rounded-xl shadow-2xl dark:bg-content-dark border border-gray-200 dark:border-border-dark"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-border-dark">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Workspace</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <MaterialSymbol icon="close" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-100 dark:ring-gray-800">
                                <img 
                                    src={displayAvatar} 
                                    alt="Workspace Avatar" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <MaterialSymbol icon="photo_camera" className="text-white text-2xl" />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>
                        {avatar && (
                             <button 
                                type="button" 
                                onClick={handleRemoveAvatar}
                                className="text-xs text-red-500 hover:underline"
                            >
                                Remove custom avatar
                            </button>
                        )}
                    </div>

                    <div>
                        <label htmlFor="ws-name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Workspace Name
                        </label>
                        <input
                            id="ws-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="My Workspace"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:opacity-90"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkspaceEditModal;