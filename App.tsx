import React, { useCallback } from 'react';
import { View, Proxy } from './types';
import Sidebar from './components/Sidebar';
import ContentManagement from './pages/ContentManagement';
import ReelsManagement from './pages/ReelsManagement';
import InstagramAccounts from './pages/InstagramAccounts';
import ProxyManagement from './pages/ProxyManagement';
import ScheduleCalendar from './pages/ScheduleCalendar';
import CareActivities from './pages/CareActivities';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import CustomTitleBar from './components/CustomTitleBar';
import InstagramScraper from './pages/InstagramScraper';
import MediaLibrary from './pages/MediaLibrary';
import ImageEditor from './pages/ImageEditor';
import EditReel from './pages/EditReel';

// Custom Hooks
import { useAppStorage, useAppAccounts, useAppNavigation, useAppIpcListeners, useAppSync } from './hooks/useApp';

const App: React.FC = () => {
    // Load all state and listeners from custom hooks
    const { isDataLoaded } = useAppStorage();
    const { accounts, setAccounts, selectedAccount, setSelectedAccount } = useAppAccounts();
    const { currentView, setCurrentView } = useAppNavigation();
    
    // Setup IPC listeners for Post/Reel status updates
    useAppIpcListeners(accounts);
    
    // Setup background sync and care schedule listeners
    useAppSync(accounts);

    // Handle proxies state
    const [proxies, setProxies] = React.useState<Proxy[]>(() => {
        try {
            const saved = localStorage.getItem('instagram-proxies');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load proxies from localStorage", e);
            return [];
        }
    });

    // Save proxies to localStorage
    React.useEffect(() => {
        try {
            localStorage.setItem('instagram-proxies', JSON.stringify(proxies));
        } catch(e) {
            console.error("Failed to save proxies to localStorage", e);
        }
    }, [proxies]);

    // Render appropriate view based on currentView
    const renderView = useCallback(() => {
        switch (currentView) {
            case View.Dashboard:
                return <Dashboard accounts={accounts} />;
            case View.Content:
                return <ContentManagement selectedAccount={selectedAccount} onAccountChange={setSelectedAccount} accounts={accounts} />;
            case View.Reels:
                return (<ReelsManagement selectedAccount={selectedAccount} onAccountChange={setSelectedAccount} accounts={accounts}/>);
            case View.Accounts:
                return <InstagramAccounts accounts={accounts} setAccounts={setAccounts} />;
            case View.Proxy:
                return <ProxyManagement accounts={accounts} setAccounts={setAccounts} proxies={proxies} setProxies={setProxies} />;
            case View.Care:
                return <CareActivities accounts={accounts} setCurrentView={setCurrentView}/>;
            case View.Scraper:
                return <InstagramScraper accounts={accounts} />;
            case View.ImageEditor:
                return <ImageEditor />;
            case View.EditReel:
                return <EditReel />;
            case View.MediaLibrary:
                return <MediaLibrary />;
            case View.Calendar:
                return <ScheduleCalendar setCurrentView={setCurrentView} selectedAccount={selectedAccount} onAccountChange={setSelectedAccount} accounts={accounts} />;
            case View.Settings:
                return <Settings />;
            default:
                return <ScheduleCalendar setCurrentView={setCurrentView} selectedAccount={selectedAccount} onAccountChange={setSelectedAccount} accounts={accounts} />;
        }
    }, [currentView, selectedAccount, accounts, proxies]);

    return (
        <div className="flex flex-col h-screen w-full font-display bg-background-light dark:bg-background-dark overflow-hidden">
            <CustomTitleBar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
                <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-background-dark overflow-y-auto min-h-0">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default App;