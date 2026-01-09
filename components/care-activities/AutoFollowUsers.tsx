import React from 'react';
import ActivitySection from './ActivitySection';
import AccountSelection from './AccountSelection';
import NumberInputControl from './NumberInputControl';
import { InstagramAccount, CareSettings } from '../../types';

interface AutoFollowUsersProps {
    settings: CareSettings;
    setSettings: React.Dispatch<React.SetStateAction<CareSettings>>;
    accounts: InstagramAccount[];
    onSelectAccounts: () => void;
}

const AutoFollowUsers: React.FC<AutoFollowUsersProps> = ({
    settings,
    setSettings,
    accounts,
    onSelectAccounts,
}) => {
    return (
        <ActivitySection
            title="Auto-Follow Users"
            description="Automatically follow users from a target account."
            isEnabled={settings.autoFollowEnabled}
            onToggle={() => setSettings(s => ({ ...s, autoFollowEnabled: !s.autoFollowEnabled }))}
        >
            {/* Account Selection */}
            <AccountSelection
                label="Select accounts for Auto-Follow"
                selectedAccountIds={settings.autoFollowAccounts}
                allAccounts={accounts}
                onClick={onSelectAccounts}
                disabled={!settings.autoFollowEnabled}
            />

            {/* Target Account Username */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Target Account Username
                </label>
                <input
                    type="text"
                    value={settings.autoFollowTargetUsername}
                    onChange={(e) => setSettings(s => ({ ...s, autoFollowTargetUsername: e.target.value }))}
                    placeholder="@username"
                    disabled={!settings.autoFollowEnabled}
                    className="w-full px-3 py-2 bg-gray-800 border border-border-dark rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
            </div>

            {/* Follow Source */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Follow Source
                </label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="followSource"
                            checked={settings.autoFollowSource === 'followers'}
                            onChange={() => setSettings(s => ({ ...s, autoFollowSource: 'followers' }))}
                            disabled={!settings.autoFollowEnabled}
                            className="w-4 h-4 text-purple-500"
                        />
                        <span className="text-sm text-gray-300">Followers of account</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="followSource"
                            checked={settings.autoFollowSource === 'following'}
                            onChange={() => setSettings(s => ({ ...s, autoFollowSource: 'following' }))}
                            disabled={!settings.autoFollowEnabled}
                            className="w-4 h-4 text-purple-500"
                        />
                        <span className="text-sm text-gray-300">Following of account</span>
                    </label>
                </div>
            </div>

            {/* Number of follows */}
            <div className="mb-4">
                <NumberInputControl
                    label="Number of follows"
                    value={settings.autoFollowCount}
                    onChangeValue={(val) => setSettings(s => ({ ...s, autoFollowCount: val }))}
                    unit="follows"
                    disabled={!settings.autoFollowEnabled}
                />
            </div>

            {/* Like & Comment Options - RIÊNG CỦA AUTO-FOLLOW */}
            <div className="space-y-3 mb-4">
                {/* Enable Like cho AUTO-FOLLOW */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.autoFollowEnableLike}
                        onChange={(e) => setSettings(s => ({ ...s, autoFollowEnableLike: e.target.checked }))}
                        disabled={!settings.autoFollowEnabled}
                        className="w-4 h-4 rounded text-purple-500"
                    />
                    <span className="text-sm text-gray-300">Enable auto-like (when following)</span>
                </label>

                {/* Enable Comment cho AUTO-FOLLOW */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.autoFollowEnableComment}
                        onChange={(e) => setSettings(s => ({ ...s, autoFollowEnableComment: e.target.checked }))}
                        disabled={!settings.autoFollowEnabled}
                        className="w-4 h-4 rounded text-purple-500"
                    />
                    <span className="text-sm text-gray-300">Enable auto-comment (when following)</span>
                </label>

                {/* Comment textarea cho AUTO-FOLLOW */}
                {settings.autoFollowEnableComment && (
                    <div className="ml-6 mt-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-400">
                            Comment templates for Auto-Follow (50-100 comments, one per line)
                        </label>
                        <textarea
                            value={settings.autoFollowComments.join('\n')}
                            onChange={(e) => {
                                const comments = e.target.value
                                    .split('\n')
                                    .map(c => c.trim())
                                    .filter(c => c.length > 0);
                                setSettings(s => ({ ...s, autoFollowComments: comments }));
                            }}
                            placeholder="Enter comments for Auto-Follow, one per line:
Nice to meet you! 🔥
Following you! ❤️
Love your content! 👏
Great profile! ✨
Awesome posts! 😍"
                            disabled={!settings.autoFollowEnabled}
                            className="w-full px-3 py-2 bg-gray-800 border border-border-dark rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-purple-500 disabled:opacity-50 min-h-[120px] max-h-[300px] resize-y overflow-y-auto custom-scrollbar"
                        />
                        <div className="flex items-center justify-between text-xs">
                            <p className={`${
                                settings.autoFollowComments.length >= 50 && settings.autoFollowComments.length <= 100
                                    ? 'text-green-400'
                                    : 'text-yellow-400'
                            }`}>
                                {settings.autoFollowComments.length} comments 
                                {settings.autoFollowComments.length < 50 && ' (minimum 50 recommended)'}
                                {settings.autoFollowComments.length > 100 && ' (maximum 100 recommended)'}
                            </p>
                            <p className="text-gray-500">
                                💡 App will randomly pick one comment per post when following
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </ActivitySection>
    );
};

export default AutoFollowUsers;