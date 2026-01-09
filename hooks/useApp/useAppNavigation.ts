import { useEffect, useState } from 'react';
import { View } from '../../types';

export const useAppNavigation = () => {
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);

    // Listen for navigation events from Electron
    useEffect(() => {
        const handleNavigateToReels = () => {
            console.log('🔄 Navigating to Reels...');
            setCurrentView(View.Reels);
        };
        
        const handleNavigateToImageEditor = () => {
            console.log('🔄 Navigating to ImageEditor...');
            setCurrentView(View.ImageEditor);
        };

        window.addEventListener('navigate-to-reels', handleNavigateToReels);
        window.addEventListener('navigate-to-image-editor', handleNavigateToImageEditor);

        return () => {
            window.removeEventListener('navigate-to-reels', handleNavigateToReels);
            window.removeEventListener('navigate-to-image-editor', handleNavigateToImageEditor);
        };
    }, []);

    return {
        currentView,
        setCurrentView
    };
};
