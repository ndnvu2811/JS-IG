import React from 'react';

interface ActivitySectionProps {
    title: string;
    description: string;
    isEnabled: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const ActivitySection: React.FC<ActivitySectionProps> = ({ title, description, isEnabled, onToggle, children }) => (
    <div className="p-6 bg-content-dark rounded-lg border border-border-dark space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="font-bold text-lg text-white">{title}</h2>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isEnabled} onChange={onToggle} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
        </div>
        <div className={`space-y-4 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            {children}
        </div>
    </div>
);

export default ActivitySection;
