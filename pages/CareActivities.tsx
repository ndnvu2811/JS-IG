import React, { useState, useEffect } from 'react';
import { InstagramAccount, View } from '../types';
import AccountSelectionModal from '../components/care-activities/AccountSelectionModal';
import CareScheduleModal from '../components/care-activities/CareScheduleModal';
import AutoBrowseNewfeed from '../components/care-activities/AutoBrowseNewfeed';
import AutoFollowUsers from '../components/care-activities/AutoFollowUsers';
import { useCareActivities } from '../hooks/useCareActivities';
import ActivityOverview from '../components/care-activities/ActivityOverview';
import { saveCareToHistory } from '../utils/historyUtils';

interface CareActivitiesProps {
    accounts: InstagramAccount[];
    setCurrentView: (view: View) => void;
}

const CareActivities: React.FC<CareActivitiesProps> = ({ accounts, setCurrentView }) => {
    const {
        settings,
        setSettings,
        isAccountModalOpen,
        setIsAccountModalOpen,
        isScheduleModalOpen,
        setIsScheduleModalOpen,
        modalConfig,
        overviewCalculations,
        openAccountSelector,
        handleSaveSelection,
        handleSaveSchedule,
    } = useCareActivities(accounts);

    const [isRunning, setIsRunning] = useState(false);
    const [progressData, setProgressData] = useState<unknown[]>([]);
    const [automationResults, setAutomationResults] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.electronAPI) {
            const cleanupBrowse = window.electronAPI.onAutoBrowseProgress((data: unknown) => {
                console.log('📊 Browse Progress:', data);
                setProgressData(prev => [...prev, data]);
            });
            
            const cleanupFollow = window.electronAPI.onAutoFollowProgress?.((data: unknown) => {
                console.log('📊 Follow Progress:', data);
                setProgressData(prev => [...prev, data]);
            });
            
            return () => {
                cleanupBrowse();
                if (cleanupFollow) cleanupFollow();
            };
        }
    }, []);

    const handleRunNow = async () => {
        if (!window.electronAPI) {
            alert('Electron API not available');
            return;
        }
        
        if (settings.autoBrowseAccounts.length === 0 && settings.autoFollowAccounts.length === 0) {
            alert('Please select at least one account!');
            return;
        }
        
        if (!settings.autoBrowseEnabled && !settings.autoFollowEnabled) {
            alert('Please enable at least one activity!');
            return;
        }

        setIsRunning(true);
        setProgressData([]);
        setAutomationResults(null);
        
        try {
            console.log('🚀 Starting automation...');
            
            let allResults = [];
            
            if (settings.autoBrowseEnabled && settings.autoBrowseAccounts.length > 0) {
                console.log('🔄 Running Auto-Browse...');
                const browseResult = await window.electronAPI.startAutoBrowse(accounts, settings);
                
                if (browseResult.success) {
                    allResults.push(...browseResult.results);
                } else {
                    allResults.push({ 
                        success: false, 
                        error: browseResult.error,
                        activity: 'Auto-Browse'
                    });
                }
            }
            
            if (settings.autoFollowEnabled && settings.autoFollowAccounts.length > 0) {
                console.log('🔄 Running Auto-Follow...');
                
                if (!window.electronAPI.startAutoFollow) {
                    console.error('❌ startAutoFollow not available');
                    allResults.push({ 
                        success: false, 
                        error: 'Auto-Follow feature not available',
                        activity: 'Auto-Follow'
                    });
                } else {
                    const followResult = await window.electronAPI.startAutoFollow(accounts, settings);
                    
                    if (followResult.success) {
                        allResults.push(...followResult.results);
                    } else {
                        allResults.push({ 
                            success: false, 
                            error: followResult.error,
                            activity: 'Auto-Follow'
                        });
                    }
                }
            }
            
            console.log('✅ All automations completed:', allResults);
            setAutomationResults(allResults);
            
        } catch (error) {
            console.error('❌ Error running automation:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setAutomationResults([{ 
                success: false, 
                error: errorMessage 
            }]);
        } finally {
            setIsRunning(false);
            
            // ✅ Save to history for Calendar (separate try-catch to not block results)
            try {
                const accountUsernames: string[] = [];
                
                if (settings.autoBrowseEnabled) {
                    accountUsernames.push(...settings.autoBrowseAccounts
                        .map(id => accounts.find(a => a.id === id)?.username)
                        .filter((u): u is string => !!u));
                }
                
                if (settings.autoFollowEnabled) {
                    accountUsernames.push(...settings.autoFollowAccounts
                        .map(id => accounts.find(a => a.id === id)?.username)
                        .filter((u): u is string => !!u));
                }
                
                if (accountUsernames.length > 0) {
                    const runNowId = `run_now_${Date.now()}`;
                    const executedTime = new Date().toISOString();
                    
                    saveCareToHistory(
                        settings,
                        accountUsernames,
                        runNowId,
                        executedTime, // scheduledAt
                        executedTime  // executedAt
                    );
                    
                    // Trigger storage change event to update Calendar
                    window.dispatchEvent(new CustomEvent('storage-change'));
                    
                    console.log('📝 Saved Run Now activity to history');
                }
            } catch (historyError) {
                console.error('❌ Failed to save history:', historyError);
            }
        }
    };

    // Helper function để lấy selectedAccountIds
    const getSelectedAccountIds = () => {
        if (!modalConfig) return [];
        
        if (modalConfig.activity === 'autoBrowse') {
            return settings.autoBrowseAccounts;
        } else if (modalConfig.activity === 'autoFollow') {
            return settings.autoFollowAccounts;
        }
        
        return [];
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto table-scrollbar pr-2">
            <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">
                        Care Activities Configuration
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Set up automated interaction actions for your Instagram account.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                    <span className="text-xs text-gray-400 px-2">Run mode:</span>
                    <button
                        onClick={() => setSettings(s => ({ ...s, autoBrowseRunMode: 'sequential' }))}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            settings.autoBrowseRunMode === 'sequential'
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Sequential
                    </button>
                    <button
                        onClick={() => setSettings(s => ({ ...s, autoBrowseRunMode: 'parallel' }))}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            settings.autoBrowseRunMode === 'parallel'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Parallel
                    </button>
                </div>
            </header>

            <div className="space-y-6">
                <AutoBrowseNewfeed
                    settings={settings}
                    setSettings={setSettings}
                    accounts={accounts}
                    onSelectAccounts={() => openAccountSelector('autoBrowse', 'Select Accounts for Auto-Browse')}
                />

                <AutoFollowUsers
                    settings={settings}
                    setSettings={setSettings}
                    accounts={accounts}
                    onSelectAccounts={() => openAccountSelector('autoFollow', 'Select Accounts for Auto-Follow')}
                />
            </div>
            {/* Activity Overview */}               
            <div className="mt-8 p-6 bg-content-dark rounded-lg border border-border-dark">
                <h3 className="font-bold text-white text-lg mb-4">Activity Overview</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <ActivityOverview 
                            details={overviewCalculations.details} 
                            totalTime={overviewCalculations.total} 
                        />
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4 border border-border-dark">
                        <h4 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
                            📊 Automation Results
                        </h4>
                        
                        {!automationResults && !isRunning && (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-sm">No results yet.</p>
                                <p className="text-xs mt-2">Click "Run Now" to start automation.</p>
                            </div>
                        )}

                        {isRunning && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-yellow-400">
                                    <div className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                                    <span className="text-sm font-medium">Running automation...</span>
                                </div>
                                
                                {progressData.length > 0 && (
                                    <div className="space-y-2">
                                        {progressData.slice(-5).map((data: any, idx) => (
                                            <div key={idx} className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded">
                                                <span className="font-medium text-gray-300">{data.account}:</span> {data.status}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {automationResults && !isRunning && (
                            <div className="space-y-3">
                                {automationResults.map((result: any, idx: number) => (
                                    <div key={idx} className={`p-3 rounded-lg border ${result.success ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-white">{result.account}</span>
                                            <span className={`text-xs px-2 py-1 rounded ${result.success ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                                                {result.success ? '✅ Success' : '❌ Failed'}
                                            </span>
                                        </div>
                                        
                                        {result.success ? (
                                            <div className="text-xs text-gray-300 space-y-1">
                                                {result.likesCount !== undefined && (
                                                    <p>👍 Likes: <span className="font-medium text-purple-400">{result.likesCount}</span></p>
                                                )}
                                                {result.followsCount !== undefined && (
                                                    <p>👥 Follows: <span className="font-medium text-blue-400">{result.followsCount}</span></p>
                                                )}
                                                {result.commentsCount > 0 && (
                                                    <p>💬 Comments: <span className="font-medium text-green-400">{result.commentsCount}</span></p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-red-400">{result.error}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-dark">
                    <p className="text-sm text-gray-400">
                        Total estimated activity time: <span className="font-bold text-lg text-purple-400">{overviewCalculations.total} seconds</span>
                    </p>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <button 
                            onClick={() => setIsScheduleModalOpen(true)}
                            className="px-6 py-2.5 text-sm font-bold bg-gray-700 rounded-lg hover:bg-gray-600 text-white"
                        >
                            Schedule
                        </button>
                        <button 
                            onClick={handleRunNow}
                            disabled={isRunning}
                            className="px-6 py-2.5 text-sm font-bold bg-purple-600 rounded-lg hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRunning ? 'Running...' : 'Run Now'}
                        </button>
                    </div>
                </div>
            </div>

            {modalConfig && 
                <AccountSelectionModal
                    isOpen={isAccountModalOpen}
                    onClose={() => setIsAccountModalOpen(false)}
                    onSave={handleSaveSelection}
                    allAccounts={accounts}
                    selectedAccountIds={getSelectedAccountIds()}
                    title={modalConfig.title}
                />
            }
            <CareScheduleModal 
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSave={handleSaveSchedule}
            />
        </div>
    );
};

export default CareActivities;