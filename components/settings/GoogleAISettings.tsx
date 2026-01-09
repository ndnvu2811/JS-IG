import React, { useState, useEffect } from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface GoogleAISettingsProps {
  t: any; // translations object
}

const GoogleAISettings: React.FC<GoogleAISettingsProps> = ({ t }) => {
  const [apiKey, setApiKey] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini-api-key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Save API key to localStorage
  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini-api-key', apiKey.trim());
      setTestResult({
        success: true,
        message: 'API Key saved successfully!',
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setTestResult(null), 3000);
    } else {
      setTestResult({
        success: false,
        message: 'Please enter a valid API Key',
      });
    }
  };

  // Test API key by making a simple request to Gemini
  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an API Key first',
      });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Hello',
                  },
                ],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'API Key is valid! ✓',
        });
      } else {
        const error = await response.json();
        setTestResult({
          success: false,
          message: `API Key test failed: ${error.error?.message || 'Invalid key'}`,
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Connection error: ${error.message}`,
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  // Clear API key
  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('gemini-api-key');
    setTestResult({
      success: true,
      message: 'API Key cleared',
    });
    setTimeout(() => setTestResult(null), 3000);
  };

  return (
    <div className="bg-content-dark rounded-lg border border-border-dark p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <MaterialSymbol
            icon="psychology"
            className="text-2xl text-purple-400"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            Google AI Settings
          </h3>
          <p className="text-sm text-gray-400">
            Configure your Google Gemini API key for AI-powered topic keyword generation
          </p>
        </div>
      </div>

      {/* API Key Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Gemini API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google Gemini API Key"
              className="flex-1 px-4 py-2 bg-content-light border border-border-dark rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleTestKey}
              disabled={isTestingKey || !apiKey.trim()}
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
          </div>

          {/* Help Text */}
          <p className="mt-2 text-xs text-gray-500">
            Get your free API key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`p-3 rounded-lg flex items-start gap-2 ${
              testResult.success
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-red-500/10 border border-red-500/20'
            }`}
          >
            <MaterialSymbol
              icon={testResult.success ? 'check_circle' : 'error'}
              className={`text-xl ${
                testResult.success ? 'text-green-400' : 'text-red-400'
              }`}
            />
            <p
              className={`text-sm ${
                testResult.success ? 'text-green-300' : 'text-red-300'
              }`}
            >
              {testResult.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <MaterialSymbol icon="save" />
            Save
          </button>
          <button
            onClick={handleClear}
            disabled={!apiKey}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <MaterialSymbol icon="delete" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleAISettings;