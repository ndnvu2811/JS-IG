import React, { useState, useEffect } from 'react';
import MaterialSymbol from '../components/icons/MaterialSymbol';
import { clearAllCalendarHistory } from '../utils/historyUtils';

type WindowPreset = 'mobile' | 'tablet' | 'desktop' | 'fullhd' | 'custom';

const presetSizes: Record<Exclude<WindowPreset, 'custom'>, { width: number; height: number }> = {
  mobile: { width: 414, height: 896 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1280, height: 800 },
  fullhd: { width: 1920, height: 1080 },
};

const Settings: React.FC = () => {
  const [chromePath, setChromePath] = useState<string>('');
  const [autoDetect, setAutoDetect] = useState(true);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Window size state
  const [windowPreset, setWindowPreset] = useState<WindowPreset>('desktop');
  const [windowWidth, setWindowWidth] = useState<number>(presetSizes.desktop.width);
  const [windowHeight, setWindowHeight] = useState<number>(presetSizes.desktop.height);

  // Accordion state - mặc định ĐÓNG
  const [openGoogleAI, setOpenGoogleAI] = useState(false);
  const [openBrowser, setOpenBrowser] = useState(false);
  const [openWindow, setOpenWindow] = useState(false);
  const [openClearCalendar, setOpenClearCalendar] = useState(false);
  
  // Clear Calendar Confirm Modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Clear Media state
  const [openClearMedia, setOpenClearMedia] = useState(false);
  const [showClearMediaConfirm, setShowClearMediaConfirm] = useState(false);
  const [clearMediaLoading, setClearMediaLoading] = useState(false);

  // Google AI API Key state
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Load Chrome settings
    const settings = await window.electronAPI.getChromeSettings();
    if (settings) {
      setChromePath(settings.chromePath || '');
      setAutoDetect(settings.autoDetectChrome !== false);
      
      // Load window size
      if (settings.windowWidth && settings.windowHeight) {
        setWindowWidth(settings.windowWidth);
        setWindowHeight(settings.windowHeight);
        
        // Tìm preset tương ứng
        const matchedPreset = Object.entries(presetSizes).find(
          ([_, size]) => size.width === settings.windowWidth && size.height === settings.windowHeight
        );
        setWindowPreset(matchedPreset ? (matchedPreset[0] as WindowPreset) : 'custom');
      }
    } else {
      const detectedPath = await window.electronAPI.getChromePath();
      if (detectedPath) {
        setChromePath(detectedPath);
        setStatus('success');
        setMessage('Chrome auto-detected successfully');
      } else {
        setStatus('error');
        setMessage('Chrome not found. Please select manually.');
      }
    }

    // Load Gemini API Key
    const savedKey = localStorage.getItem('gemini-api-key');
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }
  };

  const handleBrowse = async () => {
    const selectedPath = await window.electronAPI.browseChromePath();
    if (selectedPath) {
      setChromePath(selectedPath);
    }
  };

  const handleTest = async () => {
    if (!chromePath) {
      setStatus('error');
      setMessage('Please select Chrome path first');
      return;
    }

    setStatus('testing');
    setMessage('Testing Chrome...');

    const result = await window.electronAPI.testChromePath(chromePath);

    if (result.success) {
      setStatus('success');
      setMessage('✅ Chrome is working correctly!');
    } else {
      setStatus('error');
      setMessage(`❌ Test failed: ${result.error}`);
    }
  };

  const handleSave = async () => {
    const result = await window.electronAPI.saveChromeSettings({
      chromePath,
      autoDetectChrome: autoDetect,
      windowWidth,
      windowHeight
    });

    // Save Gemini API Key
    if (geminiApiKey.trim()) {
      localStorage.setItem('gemini-api-key', geminiApiKey.trim());
    }

    if (result.success) {
      setStatus('success');
      setMessage('Settings saved successfully!');
    } else {
      setStatus('error');
      setMessage(`❌ Save failed: ${result.error}`);
    }
  };

  const handlePresetChange = (preset: WindowPreset) => {
    setWindowPreset(preset);
    if (preset !== 'custom') {
      const size = presetSizes[preset];
      setWindowWidth(size.width);
      setWindowHeight(size.height);
    }
  };

  const handleSizeChange = (width: number, height: number) => {
    setWindowWidth(width);
    setWindowHeight(height);
    setWindowPreset('custom');
  };

  // Test Gemini API Key with fallback models
  const handleTestGeminiKey = async () => {
  if (!geminiApiKey.trim()) {
    setKeyTestResult({ success: false, message: 'Please enter an API Key first' });
    return;
  }

  setIsTestingKey(true);
  setKeyTestResult(null);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,  // ← ĐÚNG TÊN BIẾN
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        }),
      }
    );

    if (response.ok) {
      setKeyTestResult({ success: true, message: 'API Key is valid! ✓' });
    } else {
      const error = await response.json();
      setKeyTestResult({ success: false, message: `Failed: ${error.error?.message}` });
    }
  } catch (error: any) {
    setKeyTestResult({ success: false, message: `Error: ${error.message}` });
  } finally {
    setIsTestingKey(false);
  }
};

  // Clear Gemini API Key
  const handleClearGeminiKey = () => {
    setGeminiApiKey('');
    localStorage.removeItem('gemini-api-key');
    setKeyTestResult({
      success: true,
      message: 'API Key cleared',
    });
    setTimeout(() => setKeyTestResult(null), 3000);
  };

  // Clear media handler
  const handleClearMedia = async () => {
    try {
      setClearMediaLoading(true);
      const result = await window.electronAPI.clearAllMedia();
      if (result.success) {
        setStatus('success');
        setMessage(`Successfully cleared media (${result.deletedCount} files deleted)`);
        setShowClearMediaConfirm(false);
      } else {
        setStatus('error');
        setMessage(`Failed to clear media: ${result.error}`);
      }
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error clearing media:', error);
      setStatus('error');
      setMessage('Failed to clear media');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    } finally {
      setClearMediaLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto table-scrollbar pr-2">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
            Configure your application settings.
          </p>
        </div>

        {/* Message + Save button cùng một hàng */}
        <div className="flex items-center gap-3">
          {message && (
            <div
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm ${
                status === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200'
                  : status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200'
                  : status === 'testing'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              <MaterialSymbol
                icon={
                  status === 'success'
                    ? 'check_circle'
                    : status === 'error'
                    ? 'error'
                    : 'info'
                }
                className="text-base"
              />
              <span className="font-medium whitespace-nowrap">
                {message}
              </span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!chromePath}
            className="flex h-10 items-center justify-center gap-2 rounded-lg btn-instagram px-4 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MaterialSymbol icon="save" className="text-base" />
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* ========================================== */}
      {/* Google AI Settings Card (Accordion) - TOP */}
      {/* ========================================== */}
      <div className="mt-2 bg-white dark:bg-content-dark rounded-lg border border-gray-200 dark:border-border-dark">
        <button
          onClick={() => setOpenGoogleAI(!openGoogleAI)}
          className="w-full flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        >
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Google AI Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure your Google Gemini API key for AI-powered topic keyword generation
            </p>
          </div>
          <MaterialSymbol
            icon="expand_more"
            className={`text-3xl text-gray-500 dark:text-gray-300 transition-transform duration-300 ${
              openGoogleAI ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>

        {openGoogleAI && (
          <div className="p-6 space-y-4 border-t border-gray-200 dark:border-border-dark">
            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gemini API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Enter your Google Gemini API Key"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title={showApiKey ? "Hide API Key" : "Show API Key"}
                  >
                    <MaterialSymbol icon={showApiKey ? "visibility_off" : "visibility"} className="text-lg" />
                  </button>
                </div>
                <button
                  onClick={handleTestGeminiKey}
                  disabled={isTestingKey || !geminiApiKey.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isTestingKey ? (
                    <>
                      <MaterialSymbol icon="progress_activity" className="animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <MaterialSymbol icon="verified" />
                      Test
                    </>
                  )}
                </button>
                <button
                  onClick={handleClearGeminiKey}
                  disabled={!geminiApiKey}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <MaterialSymbol icon="delete" />
                  Clear
                </button>
              </div>

              {/* Help Text */}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Get your free API key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-500 hover:text-purple-400 underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            {/* Test Result */}
            {keyTestResult && (
              <div
                className={`p-3 rounded-lg flex items-start gap-2 ${
                  keyTestResult.success
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500/20'
                    : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/20'
                }`}
              >
                <MaterialSymbol
                  icon={keyTestResult.success ? 'check_circle' : 'error'}
                  className={`text-xl ${
                    keyTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                />
                <p
                  className={`text-sm ${
                    keyTestResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {keyTestResult.message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Browser Settings Card (Accordion) */}
      <div className="mt-6 bg-white dark:bg-content-dark rounded-lg border border-gray-200 dark:border-border-dark">
        <button
          onClick={() => setOpenBrowser(!openBrowser)}
          className="w-full flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        >
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Browser Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure your browser settings.
            </p>
          </div>
          <MaterialSymbol
            icon="expand_more"
            className={`text-3xl text-gray-500 dark:text-gray-300 transition-transform duration-300 ${
              openBrowser ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>

        {openBrowser && (
          <div className="p-6 space-y-4 border-t border-gray-200 dark:border-border-dark">
            {/* Chrome Path Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chrome Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chromePath}
                  onChange={(e) => setChromePath(e.target.value)}
                  placeholder="C:\Program Files\Google\Chrome\Application\chrome.exe"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <button
                  onClick={handleBrowse}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <MaterialSymbol icon="folder_open" className="text-lg" />
                  Browse
                </button>
              </div>
            </div>

            {/* Auto-detect Row */}
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDetect}
                  onChange={(e) => setAutoDetect(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Auto-detect
                </span>
              </label>
              <button
                onClick={handleTest}
                disabled={!chromePath || status === 'testing'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <MaterialSymbol icon="play_circle" className="text-lg" />
                Test Browser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Window Size Settings Card (Accordion) */}
      <div className="mt-6 bg-white dark:bg-content-dark rounded-lg border border-gray-200 dark:border-border-dark">
        <button
          onClick={() => setOpenWindow(!openWindow)}
          className="w-full flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        >
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Window Size Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure your window size settings.
            </p>
          </div>
          <MaterialSymbol
            icon="expand_more"
            className={`text-3xl text-gray-500 dark:text-gray-300 transition-transform duration-300 ${
              openWindow ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>

        {openWindow && (
          <div className="p-6 space-y-4 border-t border-gray-200 dark:border-border-dark">
            {/* Preset Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preset
              </label>
              <select
                value={windowPreset}
                onChange={(e) => handlePresetChange(e.target.value as WindowPreset)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
                <option value="desktop">Desktop</option>
                <option value="fullhd">Full HD</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Custom Width & Height */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Width
                </label>
                <input
                  type="number"
                  value={windowWidth}
                  onChange={(e) =>
                    handleSizeChange(Number(e.target.value), windowHeight)
                  }
                  disabled={windowPreset !== 'custom'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="1280"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Height
                </label>
                <input
                  type="number"
                  value={windowHeight}
                  onChange={(e) =>
                    handleSizeChange(windowWidth, Number(e.target.value))
                  }
                  disabled={windowPreset !== 'custom'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="800"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear Calendar History Card (Accordion) */}
      <div className="mt-6 bg-white dark:bg-content-dark rounded-lg border border-gray-200 dark:border-border-dark">
        <button
          onClick={() => setOpenClearCalendar(!openClearCalendar)}
          className="w-full flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        >
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Clear Calendar History
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Remove all scheduled posts and care activities from calendar
            </p>
          </div>
          <MaterialSymbol
            icon="expand_more"
            className={`text-3xl text-gray-500 dark:text-gray-300 transition-transform duration-300 ${
              openClearCalendar ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>

        {openClearCalendar && (
          <div className="p-6 border-t border-gray-200 dark:border-border-dark">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  This will permanently delete all scheduled posts and care activities from your calendar. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <MaterialSymbol icon="delete_forever" className="text-lg" />
                Clear Calendar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear Media Card (Accordion) */}
      <div className="mt-6 bg-white dark:bg-content-dark rounded-lg border border-gray-200 dark:border-border-dark">
        <button
          onClick={() => setOpenClearMedia(!openClearMedia)}
          className="w-full flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        >
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Clear Media Files
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Remove all media files (posts, reels, renders) except account avatars
            </p>
          </div>
          <MaterialSymbol
            icon="expand_more"
            className={`text-3xl text-gray-500 dark:text-gray-300 transition-transform duration-300 ${
              openClearMedia ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>

        {openClearMedia && (
          <div className="p-6 border-t border-gray-200 dark:border-border-dark">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  This will permanently delete all media files including posts, reels, rendered videos, and temporary files. Account avatars will be preserved. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowClearMediaConfirm(true)}
                disabled={clearMediaLoading}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <MaterialSymbol icon="delete_forever" className="text-lg" />
                {clearMediaLoading ? 'Clearing...' : 'Clear Media'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Confirm Clear Calendar
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to clear all calendar history? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllCalendarHistory();
                  setShowClearConfirm(false);
                  setStatus('success');
                  setMessage('Calendar history cleared successfully!');
                  setTimeout(() => {
                    setStatus('idle');
                    setMessage('');
                  }, 3000);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Clear Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Media Confirm Modal */}
      {showClearMediaConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Confirm Clear Media
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete all media files? This action cannot be undone. Account avatars will be preserved.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearMediaConfirm(false)}
                disabled={clearMediaLoading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearMedia}
                disabled={clearMediaLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearMediaLoading ? 'Clearing...' : 'Clear Media'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;