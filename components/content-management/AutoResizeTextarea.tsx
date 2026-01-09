
import React, { useRef, useLayoutEffect, useCallback } from 'react';

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    maxHeight?: number;
    minHeight?: number;
}

const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({ maxHeight = 500, minHeight = 110, ...props }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const resize = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height to get accurate scrollHeight
            const scrollHeight = textarea.scrollHeight;
            const newHeight = Math.min(scrollHeight, maxHeight);
            textarea.style.height = `${newHeight}px`;
             textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
        }
    }, [maxHeight]);

    useLayoutEffect(() => {
        resize();
    }, [props.value, props.defaultValue, resize]);

    const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
        resize();
        if (props.onInput) {
            props.onInput(event);
        }
    };

    return (
        <textarea
            ref={textareaRef}
            {...props}
            onInput={handleInput}
            style={{ maxHeight: `${maxHeight}px` }}
            className={`w-full p-2 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-instagram-purple focus:border-instagram-purple text-gray-900 dark:text-white resize-none placeholder-gray-400 dark:placeholder-gray-500 table-scrollbar min-h-[110px] ${props.className || ''}`}
//                                                                                      ^^^^^^^^^^^
        />
    );
};

export default AutoResizeTextarea;
