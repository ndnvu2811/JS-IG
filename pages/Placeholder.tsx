
import React from 'react';

interface PlaceholderProps {
    title: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Placeholder: {title}</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400">This is a placeholder page for {title}.</p>
        </div>
    );
};

export default Placeholder;