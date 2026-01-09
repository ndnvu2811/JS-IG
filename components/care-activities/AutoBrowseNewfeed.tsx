import React from 'react';
import ActivitySection from './ActivitySection';
import AccountSelection from './AccountSelection';
import NumberInputControl from './NumberInputControl';
import { InstagramAccount, CareSettings } from '../../types';

interface AutoBrowseNewfeedProps {
    settings: CareSettings;
    setSettings: React.Dispatch<React.SetStateAction<CareSettings>>;
    accounts: InstagramAccount[];
    onSelectAccounts: () => void;
}

const AutoBrowseNewfeed: React.FC<AutoBrowseNewfeedProps> = ({
    settings,
    setSettings,
    accounts,
    onSelectAccounts,
}) => {
    return (
        <ActivitySection
            title="Auto-Browse Newfeed"
            description="Enable/Disable auto-browsing of the newfeed."
            isEnabled={settings.autoBrowseEnabled}
            onToggle={() => setSettings(s => ({ ...s, autoBrowseEnabled: !s.autoBrowseEnabled }))}
        >
            {/* Account Selection */}
            <AccountSelection
                label="Select accounts for Auto-Browse"
                selectedAccountIds={settings.autoBrowseAccounts}
                allAccounts={accounts}
                onClick={onSelectAccounts}
                disabled={!settings.autoBrowseEnabled}
            />

            {/* Duration & Scroll Settings */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <NumberInputControl
                    label="Total activity duration"
                    value={settings.autoBrowseDuration}
                    onChangeValue={(val) => setSettings(s => ({ ...s, autoBrowseDuration: val }))}
                    unit="s"
                    disabled={!settings.autoBrowseEnabled}
                />
                <NumberInputControl
                    label="Scroll interval"
                    value={settings.autoBrowseScrollInterval}
                    onChangeValue={(val) => setSettings(s => ({ ...s, autoBrowseScrollInterval: val }))}
                    unit="s"
                    disabled={!settings.autoBrowseEnabled}
                />
            </div>

            {/* Like Options */}
            <div className="space-y-3 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.autoBrowseEnableLike}
                        onChange={(e) => setSettings(s => ({ ...s, autoBrowseEnableLike: e.target.checked }))}
                        disabled={!settings.autoBrowseEnabled}
                        className="w-4 h-4 rounded text-purple-500"
                    />
                    <span className="text-sm text-gray-300">Enable auto-like while browsing</span>
                </label>

                {settings.autoBrowseEnableLike && (
                    <NumberInputControl
                        label="Number of likes"
                        value={settings.autoBrowseLikeCount}
                        onChangeValue={(val) => setSettings(s => ({ ...s, autoBrowseLikeCount: val }))}
                        unit="likes"
                        disabled={!settings.autoBrowseEnabled}
                    />
                )}
            </div>
        </ActivitySection>
    );
};

export default AutoBrowseNewfeed;